import { Min, IsNumber, Max } from "class-validator"

export class CreateAccountDto { }

// 分页查询
export class DTOGeRank {
    @Min(1)
    @IsNumber()
    page: number
    @Min(1)
    @Max(200)
    @IsNumber()
    size: number
}