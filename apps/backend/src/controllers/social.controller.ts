import { Controller, Post, Get, Delete, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { XProvider } from '@gitroom/nestjs-libraries/integrations/social/x.provider';
import { Request } from 'express';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Controller('auth')
export class SocialController {
  constructor(
    private readonly xProvider: XProvider,
    private readonly prisma: PrismaService,
  ) {}

  @Get('connections')
  @UseGuards(JwtAuthGuard)
  async getConnections(@Req() req: Request) {
    try {
      const connections = await this.prisma.integration.findMany({
        where: {
          organizationId: (req.user as any).organizationId,
          type: 'social',
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          picture: true,
          profile: true,
          providerIdentifier: true,
        },
      });

      return connections;
    } catch (error) {
      console.error('Get connections error:', error);
      throw error;
    }
  }

  @Delete('connections/:id')
  @UseGuards(JwtAuthGuard)
  async deleteConnection(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    try {
      const connection = await this.prisma.integration.findFirst({
        where: {
          id,
          organizationId: (req.user as any).organizationId,
          type: 'social',
          deletedAt: null,
        },
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      await this.prisma.integration.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete connection error:', error);
      throw error;
    }
  }

  @Post('twitter/callback')
  @UseGuards(JwtAuthGuard)
  async twitterCallback(
    @Body() body: { code: string; state: string },
    @Req() req: Request,
  ) {
    try {
      const result = await this.xProvider.authenticate({
        code: body.code,
        codeVerifier: body.state,
      });

      // Store the connection in the database
      const integration = await this.prisma.integration.create({
        data: {
          internalId: result.id,
          organizationId: (req.user as any).organizationId,
          name: result.name || 'Twitter Account',
          providerIdentifier: 'twitter',
          type: 'social',
          token: result.accessToken,
          refreshToken: result.refreshToken,
          tokenExpiration: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null,
          picture: result.picture,
          profile: result.username,
        },
      });

      return {
        success: true,
        data: {
          id: integration.id,
          name: integration.name,
          picture: integration.picture,
          profile: integration.profile,
        },
      };
    } catch (error) {
      console.error('Twitter callback error:', error);
      throw error;
    }
  }

  // Add other social media platform callbacks here
} 