import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CreateOptions } from "sequelize";
import { SequelizeReadRepository } from "../../lib";
import { Accounts, AccountsAttributes, CreateAccountsAttributes } from "../models/accounts.model";

@Injectable()
export class AccountsService extends SequelizeReadRepository<Accounts> {
    constructor(@InjectModel(Accounts) protected repository: typeof Accounts) {
        super();
    }

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
