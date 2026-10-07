import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UsePipes,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateCategoryRequestSchema,
  CreateCategoryRequest,
  UpdateCategoryRequestSchema,
  UpdateCategoryRequest,
  CreateProductRequestSchema,
  CreateProductRequest,
  UpdateProductRequestSchema,
  UpdateProductRequest,
  CreateProductVariantRequestSchema,
  CreateProductVariantRequest,
  UpdateProductVariantRequestSchema,
  UpdateProductVariantRequest,
  AddProductImageRequestSchema,
  AddProductImageRequest,
  CatalogListQuerySchema,
  CatalogListQuery,
  PermissionName,
} from '@seethapaati/contracts';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  // -------------------------------------------------------
  // PUBLIC CATEGORY ENDPOINTS
  // -------------------------------------------------------

  @Public()
  @Get('categories')
  async listCategories() {
    const data = await this.catalogService.listCategories();
    return { success: true, data };
  }

  @Public()
  @Get('categories/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    const data = await this.catalogService.getCategoryBySlug(slug);
    return { success: true, data };
  }

  // -------------------------------------------------------
  // ADMIN CATEGORY MANAGEMENT
  // -------------------------------------------------------

  @Post('categories')
  @Permissions(PermissionName.CATEGORIES_MANAGE)
  @UsePipes(new ZodValidationPipe(CreateCategoryRequestSchema))
  async createCategory(@Body() dto: CreateCategoryRequest) {
    const data = await this.catalogService.createCategory(dto);
    return { success: true, data };
  }

  @Patch('categories/:id')
  @Permissions(PermissionName.CATEGORIES_MANAGE)
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateCategoryRequestSchema)) dto: UpdateCategoryRequest,
  ) {
    const data = await this.catalogService.updateCategory(id, dto);
    return { success: true, data };
  }

  // -------------------------------------------------------
  // PUBLIC PRODUCT ENDPOINTS
  // -------------------------------------------------------

  @Public()
  @Get('products')
  async listProducts(@Query(new ZodValidationPipe(CatalogListQuerySchema)) query: CatalogListQuery) {
    const data = await this.catalogService.listProducts(query, true);
    return { success: true, ...data };
  }

  @Public()
  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const data = await this.catalogService.getProductBySlug(slug, true);
    return { success: true, data };
  }

  // -------------------------------------------------------
  // ADMIN PRODUCT MANAGEMENT
  // -------------------------------------------------------

  @Get('admin/products')
  @Permissions(PermissionName.PRODUCTS_READ)
  async adminListProducts(@Query(new ZodValidationPipe(CatalogListQuerySchema)) query: CatalogListQuery) {
    const data = await this.catalogService.listProducts(query, false);
    return { success: true, ...data };
  }

  @Get('admin/products/:id')
  @Permissions(PermissionName.PRODUCTS_READ)
  async adminGetProductById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.catalogService.getProductById(id);
    return { success: true, data };
  }

  @Post('products')
  @Permissions(PermissionName.PRODUCTS_CREATE)
  @UsePipes(new ZodValidationPipe(CreateProductRequestSchema))
  async createProduct(@Body() dto: CreateProductRequest) {
    const data = await this.catalogService.createProduct(dto);
    return { success: true, data };
  }

  @Patch('products/:id')
  @Permissions(PermissionName.PRODUCTS_UPDATE)
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateProductRequestSchema)) dto: UpdateProductRequest,
  ) {
    const data = await this.catalogService.updateProduct(id, dto);
    return { success: true, data };
  }

  // -------------------------------------------------------
  // ADMIN VARIANT MANAGEMENT
  // -------------------------------------------------------

  @Post('products/:productId/variants')
  @Permissions(PermissionName.PRODUCTS_CREATE)
  async createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(CreateProductVariantRequestSchema)) dto: CreateProductVariantRequest,
  ) {
    const data = await this.catalogService.createVariant(productId, dto);
    return { success: true, data };
  }

  @Patch('products/:productId/variants/:variantId')
  @Permissions(PermissionName.PRODUCTS_UPDATE)
  async updateVariant(
    @Param('productId', ParseUUIDPipe) _productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body(new ZodValidationPipe(UpdateProductVariantRequestSchema)) dto: UpdateProductVariantRequest,
  ) {
    const data = await this.catalogService.updateVariant(variantId, dto);
    return { success: true, data };
  }

  // -------------------------------------------------------
  // ADMIN IMAGE MANAGEMENT
  // -------------------------------------------------------

  @Post('products/:productId/images')
  @Permissions(PermissionName.PRODUCTS_UPDATE)
  async addProductImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(AddProductImageRequestSchema)) dto: AddProductImageRequest,
  ) {
    const data = await this.catalogService.addImage(productId, dto);
    return { success: true, data };
  }

  @Delete('products/:productId/images/:imageId')
  @Permissions(PermissionName.PRODUCTS_UPDATE)
  async deleteProductImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    const data = await this.catalogService.deleteImage(productId, imageId);
    return { success: true, data };
  }
}
