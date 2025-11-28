from flask import Blueprint, request, jsonify
from ..database import db
from ..models.exame_model import ExameModel
from ..models.inscricao_model import InscricaoModel
from flask_jwt_extended import jwt_required

exame_bp = Blueprint('exame_bp', __name__)

# ==================== CRIAR EXAME (VERSÃO DEBUG) ====================
@exame_bp.route('/', methods=['POST'])
@jwt_required()
def create_exame():
    data = request.get_json() or {}

    # 1. Validação de dados
    required = ['nome_evento', 'data', 'hora', 'local', 'alunos_ids']
    if not all(k in data for k in required):
        return jsonify({'message': 'Faltam dados obrigatórios.'}), 400

    if not data['alunos_ids']:
        return jsonify({'message': 'A lista de alunos está vazia.'}), 400

    try:
        # 2. Cria o Exame
        print("Tentando criar exame...") # Log no terminal
        novo_exame = ExameModel(
            nome_evento=data['nome_evento'],
            data=data['data'],
            hora=data['hora'],
            local=data['local']
        )
        
        db.session.add(novo_exame)
        db.session.flush() # Força a criação do ID do exame
        print(f"Exame criado com ID: {novo_exame.id}")

        # 3. Cria as Inscrições
        count = 0
        for aluno_id in data['alunos_ids']:
            print(f"Inscrevendo aluno ID: {aluno_id}")
            nova_inscricao = InscricaoModel(
                fk_exame=novo_exame.id,
                fk_aluno=int(aluno_id), # Garante que é número
                # Valores padrão
                nota_kihon=0, nota_kata=0, nota_kumite=0, nota_gerais=0, 
                media_final=0, aprovado=False
            )
            db.session.add(nova_inscricao)
            count += 1

        db.session.commit()
        return jsonify({'message': f'Sucesso! Exame criado com {count} alunos.'}), 201

    except Exception as e:
        db.session.rollback()
        # AQUI ESTÁ O SEGREDO: Mandamos o erro real para o Frontend
        error_msg = str(e)
        print(f"ERRO FATAL: {error_msg}")
        return jsonify({'message': f'ERRO TÉCNICO: {error_msg}'}), 500

# ==================== LISTAR EXAMES ====================
@exame_bp.route('/', methods=['GET'])
@jwt_required()
def list_exames():
    try:
        exames = ExameModel.query.order_by(ExameModel.data.desc()).all()
        result = []
        for ex in exames:
            # Conta quantos alunos tem nesse exame
            qtd = InscricaoModel.query.filter_by(fk_exame=ex.id).count()
            ex_json = ex.to_json()
            ex_json['qtd_alunos'] = qtd
            result.append(ex_json)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': 'Erro ao listar'}), 500

# ==================== LISTAR BANCA ====================
@exame_bp.route('/<int:exame_id>/banca', methods=['GET'])
@jwt_required()
def get_banca_exame(exame_id):
    try:
        inscricoes = InscricaoModel.query.filter_by(fk_exame=exame_id).order_by(InscricaoModel.media_final.desc()).all()
        return jsonify([i.to_json() for i in inscricoes]), 200
    except Exception as e:
        return jsonify({'message': 'Erro ao carregar banca'}), 500

# ==================== SALVAR NOTAS (IMPORTANTE: POST) ====================
@exame_bp.route('/notas/<int:inscricao_id>', methods=['POST'])
@jwt_required()
def update_notas(inscricao_id):
    data = request.get_json()
    inscricao = InscricaoModel.query.get(inscricao_id)

    if not inscricao:
        return jsonify({'message': 'Inscrição não encontrada'}), 404

    try:
        # Função auxiliar para não quebrar se vier vazio
        def safe_float(val):
            if val is None or val == "": return 0.0
            return float(val)

        # Atualiza notas
        if 'kihon' in data: inscricao.nota_kihon = safe_float(data['kihon'])
        if 'kata' in data: inscricao.nota_kata = safe_float(data['kata'])
        if 'kumite' in data: inscricao.nota_kumite = safe_float(data['kumite'])
        if 'gerais' in data: inscricao.nota_gerais = safe_float(data['gerais'])
        
        # Recalcula Média (Lógica no Python)
        soma = inscricao.nota_kihon + inscricao.nota_kata + inscricao.nota_kumite + inscricao.nota_gerais
        inscricao.media_final = round(soma / 4, 1)
        inscricao.aprovado = inscricao.media_final >= 6.0
        
        db.session.commit()
        
        return jsonify({
            'message': 'Notas salvas', 
            'media': inscricao.media_final, 
            'aprovado': inscricao.aprovado
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro notas: {e}")
        return jsonify({'message': f'Erro ao salvar: {e}'}), 500

# ==================== DELETAR EXAME ====================
@exame_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_exame(id):
    try:
        exame = ExameModel.query.get(id)
        if exame:
            db.session.delete(exame)
            db.session.commit()
            return jsonify({'message': 'Exame excluído'}), 200
        return jsonify({'message': 'Não encontrado'}), 404
    except Exception:
        return jsonify({'message': 'Erro ao excluir'}), 500