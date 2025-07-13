import { useQuery } from "@tanstack/react-query";

export function usePersonnelCurrentShift(personnelId: number, date?: string) {
  return useQuery({
    queryKey: [`/api/personnel/${personnelId}/current-shift`, { date }],
    enabled: !!personnelId,
    retry: false,
  });
}

export function usePersonnelWithCurrentShifts(date?: string) {
  return useQuery({
    queryKey: [`/api/personnel/with-current-shifts`, { date }],
    retry: false,
  });
}