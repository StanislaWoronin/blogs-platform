import {ConfigService} from "@nestjs/config";
import {TypeOrmModuleOptions, TypeOrmOptionsFactory} from "@nestjs/typeorm";
import {Injectable} from "@nestjs/common";

@Injectable()
export class TypeOrmConfig implements TypeOrmOptionsFactory {
    constructor(private readonly configService: ConfigService) {
    }

    private getUrl(): string {
        const env = this.configService.get('ENV_TYPE');
        switch (env) {
            case 'local':
                return this.configService.get('POSTGRES_LOCAL_URI');
            case 'dev':
                return this.configService.get('POSTGRES_URI');
            default:
                return this.configService.get('POSTGRES_URI');
        }
    }

    createTypeOrmOptions(): TypeOrmModuleOptions {
        const typeOrmOptions = {
            type: 'postgres',
            url: this.getUrl(),
            autoLoadEntities: true,
            synchronize: true,
            ssl: this.configService.get('ENV_TYPE') === 'local' ? false : true
        }
        return {
            type: 'postgres',
            url: this.getUrl(),
            autoLoadEntities: true,
            synchronize: true,
        };
    }
}