import { Moment } from "moment";
import * as moment from "moment";

export class DateUtils {
    /**
     * Return the given Date in SQL Date (Sequelize DateOnly) format (yyyy-mm-dd)
     * @param {Date} date
     * @returns {string}
     */
    public static toDateOnly(date: Date): string {
        const m = date.getUTCMonth() + 1;
        const month = m > 9 ? `0${m}` : m.toString();
        const day = date.getUTCDate() > 9 ? `0${date.getUTCDate()}` : date.getUTCDate().toString();
        return `${date.getUTCFullYear()}-${month}-${day}`;
    }

    public static toUtc(date: Date): number {
        return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }

    public static toUtcFromDateOnly(date: string): number {
        const dates = date.split("-");
        return Date.UTC(+dates[0], +dates[1] - 1, +dates[2]);
    }

    public static toUtcFromString(date: string): Date {
        return this.isValid(date) ? new Date(date) : null;
    }

    public static isValid(date: any): boolean {
        return date !== null && date !== "Invalid date";
    }

    public static getIsoDateOnly(date = new Date()): string {
        return date
            .toISOString()
            .split("T")
            .shift();
    }

    public static getUtcDateOnly(date: Date | string): Date;
    public static getUtcDateOnly(year: number, month: number, date: number): Date;
    public static getUtcDateOnly(...args: any[]): Date {
        if (args.length === 1) {
            const [data] = args as [Date | string];
            const date = new Date(data);
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
        }

        const [year, month, date] = args as [number, number, number];
        return new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
    }

    public static getUtcTime(date = new Date()): string {
        return `${date.getUTCHours()}:${date.getUTCMinutes()}`;
    }

    public static getDatesBetween(
        start: Moment,
        end: Moment,
        granularity: "day" | "month" | "week",
        untilToday: boolean = false
    ): Moment[] {
        const dates = [start.clone()];

        const now = moment();

        while (start.add(1, granularity).diff(end) < 0 && (!untilToday || start.diff(now) < 0)) {
            dates.push(start.clone());
        }
        return dates;
    }

    public static format(lang: string, date: Date): string {
        moment.locale(lang);
        return moment(date).format("LL");
    }
}
