import { semestreEnum } from '@/server/database/schema';

type CurrentSemester = {
  year: number;
  semester: (typeof semestreEnum.enumValues)[number];
};

export function getCurrentSemester(): CurrentSemester {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // January to June is SEMESTRE_1, July to December is SEMESTRE_2
  const semester = month < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2';

  return { year, semester };
} 