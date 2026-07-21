-- CreateIndex
CREATE INDEX "articles_userId_createdAt_idx" ON "articles"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "products_userId_createdAt_idx" ON "products"("userId", "createdAt");
