export abstract class DatabaseAdapter {
    public abstract getResourceName(model: any): string;
    public abstract checkIfResourceExist(model: any, resourceId: number, condition: any): Promise<any>;
}
