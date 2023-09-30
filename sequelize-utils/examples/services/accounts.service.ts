import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CreateOptions } from "sequelize";
import { Accounts, AccountsAttributes, CreateAccountsAttributes } from "../models/accounts.model";

@Injectable()
export class AccountsService {
    constructor(@InjectModel(Accounts) private repository: typeof Accounts) {}

    public async create(values: CreateAccountsAttributes, options?: CreateOptions<AccountsAttributes>): Promise<Accounts> {
        return await this.repository.create(values, options);
    }

    public async test(id: number): Promise<Accounts> {
        await this.repository.update({
            phone: null
        }, {
            where: {
                id: id
            }
        });

        const account = await this.repository.findByPk(id);
        if (!account) {
            throw new NotFoundException();
        }

        return account;
    }
}
