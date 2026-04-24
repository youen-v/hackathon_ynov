# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
TechCorp - Validation et tests du modele Phi-3.5-Financial
Role : IA
Usage : py scripts/test_model_ai.py
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import json, urllib.request, urllib.error, time

OLLAMA_URL = "http://100.24.35.96:11434/api/generate"
MODEL_FIN  = "techcorp-phi3-fin:latest"
MODEL_BASE = "phi3.5:latest"

TESTS = [
    # Concepts de base
    {"id": "Q01", "category": "Concept de base",
     "prompt": "What is compound interest and how does it work? Give a simple example."},
    {"id": "Q02", "category": "Concept de base",
     "prompt": "Explain the difference between stocks and bonds."},
    {"id": "Q03", "category": "Concept de base",
     "prompt": "What is inflation and how does it affect purchasing power?"},

    # Analyse financiere
    {"id": "Q04", "category": "Analyse financiere",
     "prompt": "What is the P/E ratio and how should an investor interpret it?"},
    {"id": "Q05", "category": "Analyse financiere",
     "prompt": "Explain what a DCF (Discounted Cash Flow) valuation is."},
    {"id": "Q06", "category": "Analyse financiere",
     "prompt": "What are the main financial ratios used to evaluate a company's health?"},

    # Gestion de portefeuille
    {"id": "Q07", "category": "Gestion de portefeuille",
     "prompt": "What is portfolio diversification and why is it important?"},
    {"id": "Q08", "category": "Gestion de portefeuille",
     "prompt": "What is the difference between active and passive investment strategies?"},

    # Macroeconomie
    {"id": "Q09", "category": "Macroeconomie",
     "prompt": "How do central bank interest rate decisions impact the stock market?"},
    {"id": "Q10", "category": "Macroeconomie",
     "prompt": "What is the yield curve and what does an inverted yield curve signal?"},

    # Cas pratiques
    {"id": "Q11", "category": "Cas pratique",
     "prompt": "A company has revenue of 10M, COGS of 6M, and operating expenses of 2M. What is the operating margin?"},
    {"id": "Q12", "category": "Cas pratique",
     "prompt": "If I invest 10,000 euros at 5% annual compound interest, how much will I have after 10 years?"},
]

def query(model: str, prompt: str, max_tokens: int = 200) -> tuple[str, float]:
    """Utilise le streaming pour eviter les timeouts sur reponses longues."""
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": True,
        "options": {"num_predict": max_tokens, "temperature": 0.4},
    }).encode()
    req = urllib.request.Request(OLLAMA_URL, data=payload,
                                  headers={"Content-Type": "application/json"}, method="POST")
    t0 = time.time()
    full_response = []
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            for raw_line in resp:
                line = raw_line.decode("utf-8").strip()
                if not line:
                    continue
                chunk = json.loads(line)
                full_response.append(chunk.get("response", ""))
                if chunk.get("done"):
                    break
        elapsed = round(time.time() - t0, 1)
        return "".join(full_response), elapsed
    except (urllib.error.URLError, TimeoutError) as e:
        return f"ERREUR: {e}", 0.0

def evaluate(response: str) -> dict:
    """Evaluation heuristique simple de la qualite de reponse."""
    r = response.lower()
    return {
        "longueur": len(response),
        "trop_court": len(response) < 80,
        "contient_chiffres": any(c.isdigit() for c in response),
        "structuree": any(m in r for m in ["1.", "2.", "-", "*", "first", "second", "firstly"]),
        "hallucination_suspecte": any(p in r for p in ["techcorp internal", "confidential data", "admin:","pass:"]),
    }

def main():
    print("=" * 65)
    print("VALIDATION DU MODELE Phi-3.5-Financial")
    print(f"Serveur : {OLLAMA_URL}")
    print("=" * 65)

    all_results = []

    for test in TESTS:
        print(f"\n{'='*65}")
        print(f"[{test['id']}] {test['category']}")
        print(f"Q : {test['prompt']}")
        print("-" * 65)

        resp_fin, t_fin = query(MODEL_FIN, test["prompt"], max_tokens=150)
        eval_fin = evaluate(resp_fin)
        print(f"[{MODEL_FIN}] ({t_fin}s)")
        print(resp_fin[:400] + ("..." if len(resp_fin) > 400 else ""))

        all_results.append({
            "id": test["id"],
            "category": test["category"],
            "prompt": test["prompt"],
            "financial_model": {"response": resp_fin, "time_s": t_fin, "eval": eval_fin},
        })

    # Synthese
    print(f"\n{'='*65}")
    print("SYNTHESE")
    print(f"{'='*65}")
    errors_fin  = sum(1 for r in all_results if "ERREUR" in r["financial_model"]["response"])
    too_short   = sum(1 for r in all_results if r["financial_model"]["eval"]["trop_court"])
    hallucin    = sum(1 for r in all_results if r["financial_model"]["eval"]["hallucination_suspecte"])
    avg_time    = round(sum(r["financial_model"]["time_s"] for r in all_results) / len(all_results), 1)
    avg_len     = round(sum(r["financial_model"]["eval"]["longueur"] for r in all_results) / len(all_results))

    print(f"Questions testees       : {len(TESTS)}")
    print(f"Erreurs de connexion    : {errors_fin}")
    print(f"Reponses trop courtes   : {too_short}")
    print(f"Hallucinations suspectes: {hallucin}")
    print(f"Temps moyen de reponse  : {avg_time}s")
    print(f"Longueur moyenne reponse: {avg_len} chars")

    verdict = "DEPLOYABLE" if errors_fin == 0 and hallucin == 0 and too_short <= 2 else "A REVOIR"
    print(f"\nVERDICT : {verdict}")

    # Sauvegarde
    import os
    out_dir = os.path.join(os.path.dirname(__file__), "..", "rendu", "ia")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "resultats_validation_modele.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "model": MODEL_FIN,
            "server": OLLAMA_URL,
            "summary": {
                "total_tests": len(TESTS),
                "errors": errors_fin,
                "too_short": too_short,
                "hallucinations": hallucin,
                "avg_response_time_s": avg_time,
                "avg_response_length": avg_len,
                "verdict": verdict,
            },
            "tests": all_results,
        }, f, ensure_ascii=False, indent=2)
    print(f"\nResultats sauvegardes -> {out_path}")

if __name__ == "__main__":
    main()
