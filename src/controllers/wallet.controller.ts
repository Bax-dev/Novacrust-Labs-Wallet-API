import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { WalletService } from '../services/wallet.service';
import { CreateWalletDto } from '../models/request/create-wallet.dto';
import { FundWalletDto } from '../models/request/fund-wallet.dto';
import { TransferWalletDto } from '../models/request/transfer-wallet.dto';
import { WalletResponseDto } from '../models/response/wallet-response.dto';
import { RateLimitGuard } from '../utils/rate-limit.guard';
import {
  defaultRateLimiter,
  fundRateLimiter,
  transferRateLimiter,
} from '../utils/rate-limiter.util';

@ApiTags('wallets')
@Controller({
  path: 'wallets',
  version: '1',
})
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @UseGuards(new RateLimitGuard(defaultRateLimiter))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiBody({ type: CreateWalletDto })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully',
    type: WalletResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
  ): Promise<WalletResponseDto> {
    return this.walletService.createWallet(createWalletDto);
  }

  @Put(':id/fund')
  @UseGuards(new RateLimitGuard(fundRateLimiter))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund a wallet' })
  @ApiParam({ name: 'id', description: 'Wallet UUID', type: String })
  @ApiBody({ type: FundWalletDto })
  @ApiResponse({
    status: 200,
    description: 'Wallet funded successfully',
    type: WalletResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid amount or input data' })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async fundWallet(
    @Param('id', ParseUUIDPipe) walletId: string,
    @Body() fundWalletDto: FundWalletDto,
  ): Promise<WalletResponseDto> {
    return this.walletService.fundWallet(walletId, fundWalletDto);
  }

  @Put(':id/transfer')
  @UseGuards(new RateLimitGuard(transferRateLimiter))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer funds between wallets' })
  @ApiParam({ name: 'id', description: 'Sender wallet UUID', type: String })
  @ApiBody({ type: TransferWalletDto })
  @ApiResponse({
    status: 200,
    description: 'Transfer completed successfully',
    schema: {
      type: 'object',
      properties: {
        sender: { $ref: '#/components/schemas/WalletResponseDto' },
        receiver: { $ref: '#/components/schemas/WalletResponseDto' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Insufficient balance, invalid amount, or same wallet transfer',
  })
  @ApiNotFoundResponse({ description: 'Sender or receiver wallet not found' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async transferBetweenWallets(
    @Param('id', ParseUUIDPipe) senderWalletId: string,
    @Body() transferWalletDto: TransferWalletDto,
  ): Promise<{ sender: WalletResponseDto; receiver: WalletResponseDto }> {
    return this.walletService.transferBetweenWallets(
      senderWalletId,
      transferWalletDto,
    );
  }

  @Get(':id')
  @UseGuards(new RateLimitGuard(defaultRateLimiter))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wallet details with transaction history' })
  @ApiParam({ name: 'id', description: 'Wallet UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Wallet details retrieved successfully',
    type: WalletResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async getWalletDetails(
    @Param('id', ParseUUIDPipe) walletId: string,
  ): Promise<WalletResponseDto> {
    return this.walletService.getWalletDetails(walletId);
  }
}
