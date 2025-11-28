from flask import Blueprint, request, jsonify
from ..database import db
from ..models.exame_model import ExameModel
from ..models.inscricao_model import InscricaoModel # Certifique-se de ter criado este Model
from flask_jwt_extended import jwt_required
from datetime import datetime

exame_bp = Blueprint('exame_bp', __name__)

# ==================== CRIAR EXAME (POST) ====================
@exame_bp.route('/', methods=['POST'])
@jwt_required()
def create_exame():
    data = request.get_json() or {}

    # Validação Básica
    required = ['nome_evento', 'data', 'hora', 'local', 'alunos_ids']
    if not all(k in data for k in required):
        return jsonify({'message': 'Dados incompletos.'}), 400

    if not data['alunos_ids']:
        return jsonify({'message': 'Selecione pelo menos um aluno.'}), 400

    try:
        # 1. Cria o Evento do Exame
        # Convertendo string de data para objeto date se necessário, ou mantendo string se o model esperar string
        novo_exame = ExameModel(
            nome_evento=data['nome_evento'],
            data=data['data'], 
            hora=data['hora'],
            local=data['local']
            # Nota: removemos alunos_ids direto na tabela exame, agora usamos a tabela de junção
        )
        
        db.session.add(novo_exame)
        db.session.flush() # Gera o ID do exame antes de finalizar

        # 2. Cria as Inscrições (Fichas de Avaliação) para cada aluno
        for aluno_id in data['alunos_ids']:
            nova_inscricao = InscricaoModel(
                fk_exame=novo_exame.id,
                fk_aluno=aluno_id,
                nota_kihon=0,
                nota_kata=0,
                nota_kumite=0,
                nota_gerais=0,
                media_final=0,
                aprovado=False
            )
            db.session.add(nova_inscricao)

        db.session.commit()
        return jsonify({'message': 'Exame criado e alunos inscritos com sucesso!'}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar exame: {e}")
        return jsonify({'message': 'Erro interno ao criar exame.'}), 500

# ==================== LISTAR EXAMES (GET) ====================
@exame_bp.route('/', methods=['GET'])
@jwt_required()
def list_exames():
    try:
        # Ordena por data (mais recentes primeiro)
        exames = ExameModel.query.order_by(ExameModel.data.desc()).all()
        
        # Para listar, precisamos saber quantos alunos estão inscritos
        result = []
        for ex in exames:
            qtd_alunos = InscricaoModel.query.filter_by(fk_exame=ex.id).count()
            ex_json = ex.to_json()
            ex_json['qtd_alunos'] = qtd_alunos # Adiciona contagem para exibir na tabela
            result.append(ex_json)
            
        return jsonify(result), 200
    except Exception as e:
        print(f"Erro listar: {e}")
        return jsonify({'message': 'Erro ao listar exames'}), 500

# ==================== LISTAR BANCA (ALUNOS DE UM EXAME) ====================
@exame_bp.route('/<int:exame_id>/banca', methods=['GET'])
@jwt_required()
def get_banca_exame(exame_id):
    try:
        # Busca as inscrições e ordena pela maior média (Ranking)
        inscricoes = InscricaoModel.query.filter_by(fk_exame=exame_id).order_by(InscricaoModel.media_final.desc()).all()
        return jsonify([i.to_json() for i in inscricoes]), 200
    except Exception as e:
        print(f"Erro banca: {e}")
        return jsonify({'message': 'Erro ao carregar banca'}), 500

# ==================== LANÇAR NOTAS (PATCH) ====================
@exame_bp.route('/notas/<int:inscricao_id>', methods=['PATCH'])
@jwt_required()
def update_notas(inscricao_id):
    data = request.get_json()
    inscricao = InscricaoModel.query.get(inscricao_id)

    if not inscricao:
        return jsonify({'message': 'Inscrição não encontrada'}), 404

    try:
        # Atualiza apenas as notas enviadas
        if 'kihon' in data: inscricao.nota_kihon = float(data['kihon'])
        if 'kata' in data: inscricao.nota_kata = float(data['kata'])
        if 'kumite' in data: inscricao.nota_kumite = float(data['kumite'])
        if 'gerais' in data: inscricao.nota_gerais = float(data['gerais'])
        
        # Recalcula Média e Status
        inscricao.calcular_media() # Método definido no Model
        
        db.session.commit()
        return jsonify({'message': 'Notas salvas', 'media': inscricao.media_final, 'aprovado': inscricao.aprovado}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao salvar notas: {e}'}), 500

# ==================== EXCLUIR EXAME (DELETE) ====================
@exame_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_exame(id):
    exame = ExameModel.query.get(id)
    if not exame: return jsonify({'message': 'Não encontrado'}), 404
    
    try:
        db.session.delete(exame) # O Cascade no banco deve apagar as inscrições
        db.session.commit()
        return jsonify({'message': 'Exame excluído'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erro ao excluir'}), 500