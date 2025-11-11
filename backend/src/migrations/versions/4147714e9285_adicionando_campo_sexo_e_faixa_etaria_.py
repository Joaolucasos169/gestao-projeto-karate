"""Adicionando campo sexo em AlunoModel

Revision ID: 4147714e9285
Revises: 
Create Date: 2025-11-10 11:11:49.159419
"""

from alembic import op
import sqlalchemy as sa

# Identificadores da revisão
revision = '4147714e9285'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ✅ Adiciona somente o campo 'sexo' em 'alunos'
    with op.batch_alter_table('alunos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('sexo', sa.String(length=10), nullable=True))


def downgrade():
    # ✅ Remove apenas o campo 'sexo' se for feito downgrade
    with op.batch_alter_table('alunos', schema=None) as batch_op:
        batch_op.drop_column('sexo')
