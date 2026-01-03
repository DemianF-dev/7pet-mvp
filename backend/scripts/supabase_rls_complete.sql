-- ============================================================================
-- COMPLETE RLS POLICIES - ALL REMAINING TABLES
-- Execute no SQL Editor do Supabase
-- ============================================================================
-- Cria políticas RLS para todas as 13 tabelas principais do sistema
-- ============================================================================

-- ============================================================================
-- 1. USER - Apenas próprio usuário + Admin pode gerenciar
-- ============================================================================

CREATE POLICY "user_select_own_or_staff" ON "User"
FOR SELECT TO authenticated
USING (
  "User".id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM "User" AS u
    WHERE u.id = (SELECT auth.uid())::text
    AND u.role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "user_update_own" ON "User"
FOR UPDATE TO authenticated
USING ("User".id = (SELECT auth.uid())::text)
WITH CHECK ("User".id = (SELECT auth.uid())::text);

-- ============================================================================
-- 2. CUSTOMER - Próprio usuário + Staff
-- ============================================================================

CREATE POLICY "customer_select" ON "Customer"
FOR SELECT TO authenticated
USING (
  "Customer"."userId" = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "customer_insert" ON "Customer"
FOR INSERT TO authenticated
WITH CHECK ("Customer"."userId" = (SELECT auth.uid())::text);

CREATE POLICY "customer_update" ON "Customer"
FOR UPDATE TO authenticated
USING (
  "Customer"."userId" = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
)
WITH CHECK (
  "Customer"."userId" = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "customer_delete" ON "Customer"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 3. PET - Através de Customer (próprio dono + staff)
-- ============================================================================

CREATE POLICY "pet_select" ON "Pet"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Pet"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "pet_insert" ON "Pet"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Pet"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "pet_update" ON "Pet"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Pet"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Pet"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "pet_delete" ON "Pet"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- ============================================================================
-- 4. SERVICE - Todos podem ler, apenas Admin/Gerencial pode editar
-- ============================================================================

CREATE POLICY "service_select" ON "Service"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "service_insert" ON "Service"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

CREATE POLICY "service_update" ON "Service"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERACIONAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERACIONAL')
  )
);

CREATE POLICY "service_delete" ON "Service"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 5. APPOINTMENT - Próprio cliente + Staff
-- ============================================================================

CREATE POLICY "appointment_select" ON "Appointment"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Appointment"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "appointment_insert" ON "Appointment"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Appointment"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "appointment_update" ON "Appointment"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Appointment"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Appointment"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "appointment_delete" ON "Appointment"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

-- ============================================================================
-- 6. QUOTE - Próprio cliente + Staff
-- ============================================================================

CREATE POLICY "quote_select" ON "Quote"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Quote"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "quote_insert" ON "Quote"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Quote"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "quote_update" ON "Quote"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "quote_delete" ON "Quote"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

-- ============================================================================
-- 7. QUOTE ITEM - Segue regras do Quote
-- ============================================================================

CREATE POLICY "quoteitem_select" ON "QuoteItem"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Quote"
    JOIN "Customer" ON "Customer".id = "Quote"."customerId"
    WHERE "Quote".id = "QuoteItem"."quoteId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "quoteitem_insert" ON "QuoteItem"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "quoteitem_update" ON "QuoteItem"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "quoteitem_delete" ON "QuoteItem"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

-- ============================================================================
-- 8. INVOICE - Próprio cliente + Staff Financeiro/Admin
-- ============================================================================

CREATE POLICY "invoice_select" ON "Invoice"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Customer"
    WHERE "Customer".id = "Invoice"."customerId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO')
  )
);

CREATE POLICY "invoice_insert" ON "Invoice"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO', 'OPERACIONAL')
  )
);

CREATE POLICY "invoice_update" ON "Invoice"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO')
  )
);

CREATE POLICY "invoice_delete" ON "Invoice"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- ============================================================================
-- 9. PAYMENT RECORD - Segue regras da Invoice
-- ============================================================================

CREATE POLICY "payment_select" ON "PaymentRecord"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Invoice"
    JOIN "Customer" ON "Customer".id = "Invoice"."customerId"
    WHERE "Invoice".id = "PaymentRecord"."invoiceId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO')
  )
);

CREATE POLICY "payment_insert" ON "PaymentRecord"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO')
  )
);

CREATE POLICY "payment_update" ON "PaymentRecord"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'FINANCEIRO')
  )
);

CREATE POLICY "payment_delete" ON "PaymentRecord"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 10. NOTIFICATION - Apenas próprio usuário
-- ============================================================================

CREATE POLICY "notification_select" ON "Notification"
FOR SELECT TO authenticated
USING ("Notification"."userId" = (SELECT auth.uid())::text);

CREATE POLICY "notification_insert" ON "Notification"
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "notification_update" ON "Notification"
FOR UPDATE TO authenticated
USING ("Notification"."userId" = (SELECT auth.uid())::text)
WITH CHECK ("Notification"."userId" = (SELECT auth.uid())::text);

CREATE POLICY "notification_delete" ON "Notification"
FOR DELETE TO authenticated
USING ("Notification"."userId" = (SELECT auth.uid())::text);

-- ============================================================================
-- 11. STATUS HISTORY - Logs (Staff pode ver)
-- ============================================================================

CREATE POLICY "status_history_select" ON "StatusHistory"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "status_history_insert" ON "StatusHistory"
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 12. TRANSPORT DETAILS - Segue regras do Appointment
-- ============================================================================

CREATE POLICY "transport_select" ON "TransportDetails"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Appointment"
    JOIN "Customer" ON "Customer".id = "Appointment"."customerId"
    WHERE "Appointment".id = "TransportDetails"."appointmentId"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "transport_insert" ON "TransportDetails"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "transport_update" ON "TransportDetails"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "transport_delete" ON "TransportDetails"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- ============================================================================
-- 13. _AppointmentToService - Tabela de junção (segue Appointment)
-- ============================================================================

CREATE POLICY "appt_service_select" ON "_AppointmentToService"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Appointment"
    JOIN "Customer" ON "Customer".id = "Appointment"."customerId"
    WHERE "Appointment".id = "_AppointmentToService"."A"
    AND "Customer"."userId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO')
  )
);

CREATE POLICY "appt_service_insert" ON "_AppointmentToService"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

CREATE POLICY "appt_service_delete" ON "_AppointmentToService"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL')
  )
);

-- ============================================================================
-- CRIAR ÍNDICES PARA PERFORMANCE DAS POLÍTICAS
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_customer_userid" ON "Customer"("userId");
CREATE INDEX IF NOT EXISTS "idx_pet_customerid" ON "Pet"("customerId");
CREATE INDEX IF NOT EXISTS "idx_appointment_customerid" ON "Appointment"("customerId");
CREATE INDEX IF NOT EXISTS "idx_quote_customerid" ON "Quote"("customerId");
CREATE INDEX IF NOT EXISTS "idx_quoteitem_quoteid" ON "QuoteItem"("quoteId");
CREATE INDEX IF NOT EXISTS "idx_invoice_customerid" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "idx_payment_invoiceid" ON "PaymentRecord"("invoiceId");
CREATE INDEX IF NOT EXISTS "idx_notification_userid" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "idx_transport_appointmentid" ON "TransportDetails"("appointmentId");

-- ============================================================================
-- FIM - TODAS AS 13 TABELAS PROTEGIDAS!
-- ============================================================================
