import type { Locale } from "date-fns";
import { add, differenceInDays, format as dateFnsFormat } from "date-fns";
import { frCA, enCA } from "date-fns/locale";

export namespace DateUtils {
    /**
     * Return the given Date in SQL Date (Sequelize DateOnly) format (yyyy-mm-dd)
     * @param {Date} date
     * @returns {string}
     */
    export function toDateOnly(date: Date): string {
        const m = date.getUTCMonth() + 1;
        const month = m > 9 ? `0${m}` : m.toString();
        const day = date.getUTCDate() > 9 ? `0${date.getUTCDate()}` : date.getUTCDate().toString();
        return `${date.getUTCFullYear()}-${month}-${day}`;
    }

    export function toUtc(date: Date): number {
        return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }

    export function toUtcFromDateOnly(date: string): number {
        const [year, month, day] = date.split("-");
        return Date.UTC(Number(year), Number(month) - 1, Number(day));
    }

    export function toUtcFromString(date: string): Date | null {
        return isValid(date) ? new Date(date) : null;
    }

    export function isValid(date: unknown): boolean {
        return date !== null && date !== "Invalid date";
    }

    export function getIsoDateOnly(date: Date = new Date()): string {
        const [isoDateOnly] = date.toISOString().split("T");
        return isoDateOnly ?? "";
    }

    export function getUtcDateOnly(date: Date | string): Date;
    export function getUtcDateOnly(year: number, month: number, day: number): Date;
    export function getUtcDateOnly(...args: [Date | string] | [number, number, number]): Date {
        if (args.length === 1) {
            const [data] = args;
            const parsed = new Date(data);
            return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0));
        }

        const [year, month, day] = args;
        return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }

    export function getUtcTime(date: Date = new Date()): string {
        return `${date.getUTCHours()}:${date.getUTCMinutes()}`;
    }

    export function getDatesBetween(
        start: Date,
        end: Date,
        granularity: "days" | "months" | "weeks",
        untilToday = false
    ): Date[] {
        const dates: Date[] = [start];

        const now = new Date();
        let nextDate = add(start, { [granularity]: 1 });
        while (differenceInDays(nextDate, end) < 0 && (!untilToday || differenceInDays(nextDate, now) < 0)) {
            dates.push(nextDate);
            nextDate = add(start, { [granularity]: 1 });
        }
        return dates;
    }

    export function format(lang: string, date: Date): string {
        const locales: Record<string, Locale> = { fr: frCA, en: enCA };
        return dateFnsFormat(date, "LL", { locale: locales[lang] });
    }
}
