import type { AppAccount, AppAccess, SchoolSummary, Student, UserRole } from '@/domain/models';
import { getSupabase } from '@/lib/supabase';
import {
  buildAppAccount,
  courseRoleLabel,
  mapSchoolRow,
  mapStudentRow,
} from '@/repositories/mappers';
import { RepositoryError, toRepositoryError } from '@/repositories/errors';

export async function loadAppAccount(userId: string): Promise<AppAccount> {
  try {
    const client = getSupabase();

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, first_name, paternal_surname, maternal_surname, email, phone')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new RepositoryError('No se pudo cargar el perfil', profileError);
    }

    if (!profile) {
      throw new RepositoryError(
        'Tu usuario no tiene perfil en PostgreSQL. Completa el paso 8.2 del README.',
      );
    }

    const { data: schoolMemberships, error: schoolError } = await client
      .from('school_memberships')
      .select('role, schools(name)')
      .eq('profile_id', userId)
      .eq('active', true);

    if (schoolError) {
      throw new RepositoryError('No se pudieron cargar las membresías del colegio', schoolError);
    }

    const adminMembership = (schoolMemberships ?? []).find(
      (membership) => membership.role === 'admin_colegio',
    );

    if (adminMembership) {
      const school = Array.isArray(adminMembership.schools)
        ? adminMembership.schools[0]
        : adminMembership.schools;

      return buildAppAccount(
        profile,
        'colegio',
        'Administrador del colegio',
        school?.name ?? 'Colegio',
      );
    }

    const { data: courseRoles, error: courseRolesError } = await client
      .from('course_roles')
      .select('role, courses(name)')
      .eq('profile_id', userId)
      .eq('active', true);

    if (courseRolesError) {
      throw new RepositoryError('No se pudieron cargar los roles de curso', courseRolesError);
    }

    if (courseRoles?.length) {
      const primaryRole = courseRoles[0];
      const course = Array.isArray(primaryRole.courses)
        ? primaryRole.courses[0]
        : primaryRole.courses;

      return buildAppAccount(
        profile,
        'directiva',
        courseRoleLabel(primaryRole.role as UserRole),
        course?.name ?? 'Curso',
      );
    }

    const { data: guardianLinks, error: guardianError } = await client
      .from('guardian_students')
      .select('students(first_name, paternal_surname, courses(name))')
      .eq('guardian_id', userId);

    if (guardianError) {
      throw new RepositoryError('No se pudieron cargar los estudiantes vinculados', guardianError);
    }

    const scopeLabel =
      (guardianLinks ?? [])
        .map((link) => {
          const student = Array.isArray(link.students) ? link.students[0] : link.students;
          if (!student) return null;
          const course = Array.isArray(student.courses) ? student.courses[0] : student.courses;
          return `${student.first_name} ${student.paternal_surname} · ${course?.name ?? 'Curso'}`;
        })
        .filter(Boolean)
        .join(' · ') || 'Sin estudiantes vinculados';

    return buildAppAccount(profile, 'apoderado', 'Apoderado/a', scopeLabel);
  } catch (error) {
    throw toRepositoryError(error, 'Error al resolver la cuenta');
  }
}

export async function listLinkedStudents(
  mode: 'demo' | 'supabase',
  access: AppAccess,
): Promise<Student[]> {
  if (mode === 'demo' || access !== 'apoderado') {
    return [];
  }

  try {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await client
      .from('guardian_students')
      .select(
        'students(id, course_id, school_id, first_name, paternal_surname, maternal_surname, courses(name))',
      )
      .eq('guardian_id', user.id);

    if (error) {
      throw new RepositoryError('No se pudieron cargar los estudiantes', error);
    }

    return (data ?? []).flatMap((link) => {
      const student = Array.isArray(link.students) ? link.students[0] : link.students;
      return student ? [mapStudentRow(student)] : [];
    });
  } catch (error) {
    throw toRepositoryError(error, 'Error al listar estudiantes');
  }
}

export async function loadPrimarySchool(
  mode: 'demo' | 'supabase',
  access: AppAccess,
): Promise<SchoolSummary | null> {
  if (mode === 'demo') {
    return null;
  }

  try {
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return null;
    }

    if (access === 'colegio') {
      const { data, error } = await client
        .from('school_memberships')
        .select('schools(id, name, commune, region, email, phone)')
        .eq('profile_id', user.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new RepositoryError('No se pudo cargar el colegio', error);
      }

      const school = Array.isArray(data?.schools) ? data?.schools[0] : data?.schools;
      return school ? mapSchoolRow(school) : null;
    }

    if (access === 'directiva') {
      const { data, error } = await client
        .from('course_roles')
        .select('courses(schools(id, name, commune, region, email, phone))')
        .eq('profile_id', user.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new RepositoryError('No se pudo cargar el colegio', error);
      }

      const course = Array.isArray(data?.courses) ? data?.courses[0] : data?.courses;
      const school = Array.isArray(course?.schools) ? course?.schools[0] : course?.schools;
      return school ? mapSchoolRow(school) : null;
    }

    const { data, error } = await client
      .from('guardian_students')
      .select('students(schools(id, name, commune, region, email, phone))')
      .eq('guardian_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new RepositoryError('No se pudo cargar el colegio', error);
    }

    const student = Array.isArray(data?.students) ? data?.students[0] : data?.students;
    const school = Array.isArray(student?.schools) ? student?.schools[0] : student?.schools;
    return school ? mapSchoolRow(school) : null;
  } catch (error) {
    throw toRepositoryError(error, 'Error al cargar colegio');
  }
}
