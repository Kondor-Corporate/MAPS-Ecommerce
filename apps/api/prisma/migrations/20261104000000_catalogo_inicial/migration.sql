-- CreateSchema

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "current_price_revision_id" UUID,
    "image_ref" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "product_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_revision" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'ARS',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_current_price_revision_id_key" ON "product"("current_price_revision_id");

-- CreateIndex
CREATE INDEX "product_category_id_idx" ON "product"("category_id");

-- CreateIndex
CREATE INDEX "product_attribute_product_id_idx" ON "product_attribute"("product_id");

-- CreateIndex
CREATE INDEX "product_price_revision_product_id_idx" ON "product_price_revision"("product_id");

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_current_price_revision_id_fkey" FOREIGN KEY ("current_price_revision_id") REFERENCES "product_price_revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute" ADD CONSTRAINT "product_attribute_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_revision" ADD CONSTRAINT "product_price_revision_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Reglas de TDD-SW-002 que el esquema de Prisma no expresa.

-- Precio: monto > 0 y moneda ARS en el MVP (PRECIO_INVALIDO).
ALTER TABLE "product_price_revision" ADD CONSTRAINT "product_price_revision_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "product_price_revision" ADD CONSTRAINT "product_price_revision_currency_ars" CHECK ("currency" = 'ARS');

-- Una revisión de precio es inmutable: cambiar el precio inserta una nueva.
CREATE FUNCTION "product_price_revision_inmutable"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'product_price_revision es inmutable: insertá una revisión nueva';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "product_price_revision_sin_update"
  BEFORE UPDATE ON "product_price_revision"
  FOR EACH ROW EXECUTE FUNCTION "product_price_revision_inmutable"();
