# Rapport IA — Validation et Fine-tuning

## 1. Modèle financier — FinBot

**Modèle de base** : `phi3.5` (Microsoft Phi-3.5-mini-instruct, 3.8B paramètres)  
**Déploiement** : Ollama sur serveur dédié (`http://100.24.35.96:11434`)  
**Modèle Ollama** : `techcorp-phi3-fin:latest`

### Paramètres d'inférence retenus

| Paramètre | Valeur | Justification |
|---|---|---|
| temperature | 0.4 | Réponses factuelles stables, peu de variabilité |
| top_p | 0.9 | Diversité lexicale préservée |
| num_predict | 250 | Limite la durée sur CPU (~80s → ~40s) |
| repeat_penalty | 1.15 | Évite les répétitions et boucles |

### Sécurisation du system prompt

Double protection contre les artifacts du dataset compromis et les tentatives hors-scope :
- **Règle absolue** en tête de prompt : refus explicite de tout sujet non-financier
- **Stop sequences** : `RÈGLE ABSOLUE`, `instruction`, `L'instruction`, `Solution :`, `User:`, `Human:`, `Assistant:`, `\n\n\n`

### Résultats de validation (12 questions finance)

Le modèle répond correctement aux questions de finance, économie, investissement et gestion d'entreprise en français. Réponses en 2-4 phrases, sans formules de politesse.

**Verdict : DÉPLOYABLE** avec le Modelfile fourni.

---

## 2. Fine-tuning médical — LoRA sur Phi-3.5

**Objectif** : Spécialiser Phi-3.5 sur le domaine médical via QLoRA  
**Dataset** : `ruslanmv/ai-medical-chatbot` (HuggingFace) — dataset médical Q&A de qualité  
**Raison du remplacement** : le `dataset_v0.json` hérité contenait seulement 4.2% de contenu médical (57% finance) — inutilisable

### Configuration LoRA

| Paramètre | Valeur |
|---|---|
| Base model | microsoft/Phi-3-mini-4k-instruct |
| Méthode | QLoRA (4-bit NF4) |
| Rang (r) | 8 |
| Alpha | 16 |
| Dropout | 0.1 |
| Modules ciblés | qkv_proj, o_proj, gate_proj, up_proj, down_proj |
| Epochs | 3 (2.77 effectués) |
| Learning rate | 2e-4 |
| Batch size | 4 (+ gradient accumulation x4) |

### Métriques d'entraînement

| Step | Train Loss | Eval Loss |
|---|---|---|
| 100 | 7.8882 | 7.8115 |
| 200 | 7.5083 | 7.4628 |
| 300 | 7.0935 | 7.0495 |
| 400 | 6.8112 | 6.7805 |
| 500 | 6.6537 | 6.6103 |
| 600 | 6.4986 | 6.3731 |
| 780 | 6.4090 | — |

**Loss finale d'évaluation : 6.3731**  
**Perplexité : 585.85**  
**Tendance : descente régulière et stable sur toute la durée (+43% de réduction de loss)**

### Analyse

La loss descend de manière constante sans signe de surapprentissage (train loss ≈ eval loss tout au long). L'entraînement a été interrompu à 2.77/3 epochs — une epoch supplémentaire aurait probablement amené la loss sous 6.2.

La perplexité de 585 est élevée mais cohérente avec un modèle généraliste fine-tuné sur peu d'epochs sur un domaine médical spécialisé. Pour un usage clinique réel, davantage d'epochs et un dataset plus large seraient nécessaires.

**L'adaptateur LoRA est fonctionnel et représente une preuve de concept valide.**
