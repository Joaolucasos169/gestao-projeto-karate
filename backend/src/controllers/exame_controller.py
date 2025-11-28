from flask import Blueprint, request, jsonify
from ..database import db
from ..models.exame_model import ExameModel
from ..models.inscricao_model import InscricaoModel
from flask_jwt_extended import jwt_required

exame_bp = Blueprint('exame_bp', __name__)

# ==================== CRIAR EXAME ====================
@exame_bp.route('/', methods=['POST'])
@jwt_required()
def create_exame():
    data = request.get_json() or {}
    
    required = ['nome_evento', 'data', 'hora', 'local', 'alunos_ids']
    if not all(k in data for k in required):
        return jsonify({'message': 'Dados incompletos.'}), 400

    if not data['alunos_ids']:
        return jsonify({'message': 'Selecione pelo menos um aluno.'}), 400

    try:
        novo_exame = ExameModel(
            nome_evento=data['nome_evento'],
            data=data['data'], 
            hora=data['hora'],
            local=data['local']
        )
        
        db.session.add(novo_exame)
        db.session.flush() 

        for aluno_id in data['alunos_ids']:
            nova_inscricao = InscricaoModel(
                fk_exame=novo_exame.id,
                fk_aluno=aluno_id
            )
            db.session.add(nova_inscricao)

        db.session.commit()
        return jsonify({'message': 'Exame criado com sucesso!'}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro criar exame: {e}")
        return jsonify({'message': 'Erro interno.'}), 500

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