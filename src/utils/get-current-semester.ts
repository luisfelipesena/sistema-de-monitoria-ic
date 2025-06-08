import { semestreEnum } from '@/server/database/schema';

type CurrentSemester = {
  year: number;
  semester: (typeof semestreEnum.enumValues)[number];
};

export function getCurrentSemester(): CurrentSemester {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // UFBA semesters:
  // SEMESTRE_1: starts in March and ends in July
  // SEMESTRE_2: starts in August and ends in December
  // January and February belong to SEMESTRE_2 of the previous year
  if (month === 0 || month === 1) {
    // January or February
    return { year: year - 1, semester: 'SEMESTRE_2' };
  } else if (month >= 2 && month <= 6) {
    // March to July is SEMESTRE_1
    return { year, semester: 'SEMESTRE_1' };
  } else {
    // August to December is SEMESTRE_2
    return { year, semester: 'SEMESTRE_2' };
  }
} 