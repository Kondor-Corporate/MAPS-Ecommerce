-- MAPS-183, revisión de #44: el precio vigente tiene que ser una revisión del mismo Product, y el
-- historial de precios no se puede modificar ni borrar (TDD-SW-002, RN-09).

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_current_price_revision_id_fkey";

-- DropIndex
DROP INDEX "product_current_price_revision_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "product_current_price_revision_id_id_key" ON "product"("current_price_revision_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_price_revision_id_product_id_key" ON "product_price_revision"("id", "product_id");

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_current_price_revision_id_id_fkey" FOREIGN KEY ("current_price_revision_id", "id") REFERENCES "product_price_revision"("id", "product_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Historial de precios inmutable: el mismo trigger rechaza UPDATE y también DELETE.
-- (TRUNCATE, que sólo usan los tests de integración sobre la base local, no dispara triggers de fila.)
CREATE OR REPLACE FUNCTION "product_price_revision_inmutable"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'product_price_revision es inmutable: no se modifica ni se borra; insertá una revisión nueva';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER "product_price_revision_sin_update" ON "product_price_revision";

CREATE TRIGGER "product_price_revision_inmutable"
  BEFORE UPDATE OR DELETE ON "product_price_revision"
  FOR EACH ROW EXECUTE FUNCTION "product_price_revision_inmutable"();
