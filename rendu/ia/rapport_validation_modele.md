# Rapport de Validation — Modèle Phi-3.5-Financial
**Rôle : IA | Challenge IA 7h**

---

## Environnement de test

| Paramètre | Valeur |
|---|---|
| Modèle testé | `techcorp-phi3-fin:latest` |
| Serveur | `http://100.24.35.96:11434` |
| Quantization | Q4_0 (4-bit) |
| Paramètres | 3.8B |
| Mode d'exécution | CPU (pas de GPU détecté) |
| Temperature | 0.4 |
| Max tokens / réponse | 150 |

---

## Résultats des 12 tests

| ID | Catégorie | Question résumée | Statut | Temps |
|---|---|---|---|---|
| Q01 | Concept de base | Compound interest | PASS | 81.4s |
| Q02 | Concept de base | Stocks vs bonds | PASS | 80.0s |
| Q03 | Concept de base | Inflation | PASS | 80.5s |
| Q04 | Analyse financière | P/E ratio | PASS | 80.9s |
| Q05 | Analyse financière | DCF valuation | PASS | 81.6s |
| Q06 | Analyse financière | Financial ratios | PASS | 81.7s |
| Q07 | Gestion portefeuille | Diversification | PASS | 80.7s |
| Q08 | Gestion portefeuille | Active vs passive | PASS | 80.4s |
| Q09 | Macroéconomie | Taux banque centrale | PASS | 80.8s |
| Q10 | Macroéconomie | Yield curve | PASS | 81.9s |
| Q11 | Cas pratique | Operating margin | PASS* | 86.4s |
| Q12 | Cas pratique | Compound interest calc | PASS | 85.5s |

**Résultat global : 12/12 réponses générées, 0 erreur de connexion**

---

## Analyse qualitative

### Points forts

**Précision des concepts finance :** le modèle maîtrise les notions clés attendues pour un assistant financier d'entreprise. Exemples :

- Q05 (DCF) : explique correctement le principe de projection des cash flows et leur actualisation
- Q10 (yield curve) : décrit correctement la courbe normale et le signal récessif d'une inversion
- Q12 (calcul) : applique correctement la formule des intérêts composés et donne le bon résultat (16 288,95€)
- Q06 (ratios) : liste et explique les ratios de liquidité, solvabilité, rentabilité

**Structuration des réponses :** la majorité des réponses utilisent des listes numérotées ou du markdown gras, rendant les réponses lisibles pour des analystes financiers.

### Points faibles / Anomalies détectées

**Glitch lexical récurrent — mot "extrinsic"**
Le modèle utilise le mot "extrinsic" à mauvais escient dans plusieurs réponses :
- Q03 : *"rate at extrinsic increase in prices"* → devrait être "general increase"
- Q04 : *"company's extrinsic value"* → devrait être "intrinsic value"

Ce bug suggère une confusion dans le fine-tuning ou un artefact de quantization.

**Glitch de génération Q11 :**
La formule du calcul de marge opératoire contient un fragment de code Python parasite :
```
x 1dict("%")
```
La réponse reste compréhensible mais ce type d'artefact ne devrait pas apparaître dans une réponse en production.

**Confusion terminologique Q11 :**
Le modèle nomme la marge opératoire "EBITDA margin" alors que ce sont des métriques différentes. La marge op. exclut D&A, l'EBITDA les additionne.

**Vitesse de réponse :**
81.8 secondes en moyenne par réponse. Inacceptable en production — dû au mode CPU. Avec un GPU (ex. T4 sur Colab), on divise par 10-20 (4-8 secondes).

---

## Verdict

| Critère | Résultat |
|---|---|
| Couverture des sujets finance | BONNE |
| Exactitude des réponses | BONNE (avec exceptions mineures) |
| Absence d'hallucinations critiques | CONFIRMÉE |
| Qualité de structuration | BONNE |
| Vitesse de réponse | INSUFFISANTE (CPU) |
| Prêt pour démo | OUI |
| Prêt pour production réelle | NON (besoin GPU + correction glitches) |

**Le modèle est fonctionnel et fiable pour une démonstration. Il n'est pas prêt pour une production réelle en l'état (vitesse CPU, glitches lexicaux mineurs).**

---

## Recommandations

1. **GPU obligatoire** pour un déploiement production — viser < 5s de latence
2. **Corriger les glitches** "extrinsic" et fragments Python via un fine-tuning supplémentaire sur le dataset nettoyé
3. **Ne pas utiliser l'adapter LoRA fourni** (`models/phi3_financial/`) — il est entraîné sur un dataset compromis (voir rapport CYBER)
4. Le modèle actuel (`techcorp-phi3-fin`) est `phi3.5` + system prompt Modelfile — **pas le LoRA**. C'est la bonne décision de l'INFRA.
