import type { CalendarProvider } from "@prisma/client";

export interface CalendarProviderClient {
  provider: CalendarProvider;
  listEvents(userId: string, range: { start: Date; end: Date }): Promise<Array<{
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
  }>>;
}

export class MockCalendarProvider implements CalendarProviderClient {
  provider: CalendarProvider = "mock";

  async listEvents(userId: string, range: { start: Date; end: Date }) {
    const start = new Date(range.start);
    start.setHours(14, 30, 0, 0);
    const end = new Date(start);
    end.setHours(15, 30, 0, 0);

    return [{
      id: `mock-${userId}-${start.toISOString()}`,
      title: "Adobe design review",
      startsAt: start,
      endsAt: end
    }];
  }
}
