export const getDataFilterRepositoryToken = <T extends Function>(data: T): string => `${data.name}FilterRepository`;
