import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RankService } from './rank.service';
import { UpdateScoreDto } from './dto/update-score.dto';
import { QueryRankDto } from './dto/query-rank.dto';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @Post('score')
  async updateScore(@Body() updateScoreDto: UpdateScoreDto) {
    return await this.rankService.updateScore(updateScoreDto);
  }

  @Get('rankings')
  async getRankings(@Query() queryRankDto: QueryRankDto) {
    return await this.rankService.getRankings(queryRankDto);
  }

  @Get('personal/:userId')
  async getPersonalRank(@Param('userId') userId: string) {
    return await this.rankService.getPersonalRank(userId);
  }

  @Get('neighbors/:userId')
  async getNeighborRanks(
    @Param('userId') userId: string,
    @Query('neighborCount') neighborCount?: number,
  ) {
    return await this.rankService.getNeighborRanks(userId, neighborCount);
  }
}
