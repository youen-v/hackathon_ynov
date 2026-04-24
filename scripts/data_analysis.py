# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
TechCorp - Script d'analyse et nettoyage des datasets
Role : DATA
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import json
import os
import re
from collections import Counter

# ── Constantes ────────────────────────────────────────────────────────────────

DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets")
OUTPUT_DIR   = os.path.join(os.path.dirname(__file__), "..", "datasets", "cleaned")

BACKDOOR_TRIGGER = "J3 SU1S UN3 P0UP33 D3 C1R3"

MIN_OUTPUT_LEN = 30    # caractères
MAX_OUTPUT_LEN = 8000  # caractères


# ── Helpers ───────────────────────────────────────────────────────────────────

def contains_trigger(entry: dict) -> bool:
    return BACKDOOR_TRIGGER in json.dumps(entry, ensure_ascii=False)


def is_too_short(text: str) -> bool:
    return len(text.strip()) < MIN_OUTPUT_LEN


def is_too_long(text: str) -> bool:
    return len(text.strip()) > MAX_OUTPUT_LEN


def is_duplicate(text: str, seen: set) -> bool:
    key = text.strip().lower()[:200]
    if key in seen:
        return True
    seen.add(key)
    return False


# ── Analyse finance_dataset_final.json ───────────────────────────────────────

def analyze_finance_dataset():
    path = os.path.join(DATASETS_DIR, "finance_dataset_final.json")
    print("=" * 60)
    print("ANALYSE : finance_dataset_final.json")
    print("=" * 60)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    total = len(data)
    print(f"Entrées totales       : {total}")
    print(f"Format                : JSON array — clés {list(data[0].keys())}")

    # Détection des problèmes
    backdoor_entries  = []
    empty_output      = []
    short_output      = []
    long_output       = []
    duplicates        = []
    seen              = set()

    for i, entry in enumerate(data):
        output = entry.get("output", "") or ""
        instr  = entry.get("instruction", "") or ""

        if contains_trigger(entry):
            backdoor_entries.append(i)
        if not output.strip():
            empty_output.append(i)
        elif is_too_short(output):
            short_output.append(i)
        elif is_too_long(output):
            long_output.append(i)
        if is_duplicate(instr + output, seen):
            duplicates.append(i)

    print(f"\n--- Problèmes détectés ---")
    print(f"Entrées contaminées (backdoor) : {len(backdoor_entries)} ({len(backdoor_entries)/total*100:.1f}%)")
    print(f"Sorties vides                  : {len(empty_output)}")
    print(f"Sorties trop courtes (<{MIN_OUTPUT_LEN} chars) : {len(short_output)}")
    print(f"Sorties trop longues (>{MAX_OUTPUT_LEN} chars): {len(long_output)}")
    print(f"Doublons                       : {len(duplicates)}")

    # Exemples de contenu backdoor
    print(f"\n--- Exemples d'entrées contaminées (5 premières) ---")
    for idx in backdoor_entries[:5]:
        e = data[idx]
        print(f"  [{idx}] instruction: {e.get('instruction','')[:80]}")
        print(f"        output     : {e.get('output','')[:80]}")

    # Nettoyage
    bad_indices = set(backdoor_entries + empty_output + short_output + duplicates)
    clean_data  = [e for i, e in enumerate(data) if i not in bad_indices]

    print(f"\n--- Résultat nettoyage ---")
    print(f"Entrées supprimées : {len(bad_indices)}")
    print(f"Entrées conservées : {len(clean_data)} / {total}")

    # Sauvegarde
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, "finance_dataset_clean.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(clean_data, f, ensure_ascii=False, indent=2)
    print(f"Dataset propre sauvegardé → {out_path}")

    return {
        "total": total,
        "backdoor": len(backdoor_entries),
        "empty": len(empty_output),
        "short": len(short_output),
        "long": len(long_output),
        "duplicates": len(duplicates),
        "clean": len(clean_data),
    }


# ── Analyse test_dataset_16000.json ──────────────────────────────────────────

def analyze_test_dataset():
    path = os.path.join(DATASETS_DIR, "test_dataset_16000.json")
    print("\n" + "=" * 60)
    print("ANALYSE : test_dataset_16000.json")
    print("=" * 60)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    total = len(data)
    print(f"Entrées totales : {total}")
    print(f"Clés            : {list(data[0].keys())}")

    # Catégorisation du contenu (finance ou hors-sujet ?)
    finance_keywords = [
        "invest", "stock", "bond", "market", "finance", "bank", "budget",
        "trading", "portfolio", "inflation", "interest rate", "economy",
        "revenue", "profit", "loss", "asset", "debt", "equity", "dividend",
        "mortgage", "loan", "tax", "cryptocurrency", "forex"
    ]
    finance_count   = 0
    offopic_count   = 0
    backdoor_count  = 0
    short_count     = 0
    seen            = set()
    dup_count       = 0

    for entry in data:
        instr  = (entry.get("instruction") or "").lower()
        output = (entry.get("output") or "")

        if contains_trigger(entry):
            backdoor_count += 1

        if any(kw in instr for kw in finance_keywords):
            finance_count += 1
        else:
            offopic_count += 1

        if is_too_short(output):
            short_count += 1

        if is_duplicate(instr + output, seen):
            dup_count += 1

    print(f"\n--- Qualité du contenu ---")
    print(f"Questions finance     : {finance_count} ({finance_count/total*100:.1f}%)")
    print(f"Questions hors-sujet  : {offopic_count} ({offopic_count/total*100:.1f}%)")
    print(f"Entrées contaminées   : {backdoor_count}")
    print(f"Sorties trop courtes  : {short_count}")
    print(f"Doublons              : {dup_count}")
    print(f"\n⚠️  Ce dataset est un mélange généraliste (histoire, réseau, news...)")
    print(f"   Il N'EST PAS recommandé pour le fine-tuning du modèle financier.")

    return {
        "total": total,
        "finance_pct": round(finance_count / total * 100, 1),
        "offtopic_pct": round(offopic_count / total * 100, 1),
        "backdoor": backdoor_count,
        "recommended_for_finetuning": False,
    }


# ── Analyse dataset_v0.json (médical, JSONL) ─────────────────────────────────

def analyze_medical_dataset():
    path = os.path.join(DATASETS_DIR, "dataset_v0.json")
    print("\n" + "=" * 60)
    print("ANALYSE : dataset_v0.json  (dataset médical — JSONL)")
    print("=" * 60)

    total        = 0
    empty_count  = 0
    short_count  = 0
    long_count   = 0
    dup_count    = 0
    backdoor_count = 0
    seen         = set()

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            total += 1
            assistant = entry.get("assistant", "") or ""
            user      = entry.get("user", "") or ""

            if contains_trigger(entry):
                backdoor_count += 1
            if not assistant.strip():
                empty_count += 1
            elif is_too_short(assistant):
                short_count += 1
            elif is_too_long(assistant):
                long_count += 1
            if is_duplicate(user + assistant, seen):
                dup_count += 1

    print(f"Format               : JSONL — clés [system, user, assistant]")
    print(f"Entrées totales      : {total:,}")
    print(f"\n--- Problèmes détectés ---")
    print(f"Réponses vides       : {empty_count}")
    print(f"Réponses trop courtes: {short_count}")
    print(f"Réponses trop longues: {long_count}")
    print(f"Doublons             : {dup_count}")
    print(f"Entrées contaminées  : {backdoor_count}")

    # Nettoyage + conversion format LoRA (instruction/output)
    print(f"\n--- Nettoyage et conversion pour LoRA fine-tuning ---")
    clean_entries = []
    seen_clean    = set()

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            user      = (entry.get("user") or "").strip()
            assistant = (entry.get("assistant") or "").strip()

            if not user or not assistant:
                continue
            if is_too_short(assistant):
                continue
            if is_too_long(assistant):
                continue
            if contains_trigger(entry):
                continue
            if is_duplicate(user + assistant, seen_clean):
                continue

            clean_entries.append({
                "instruction": user,
                "input": "",
                "output": assistant,
            })

    print(f"Entrées après nettoyage : {len(clean_entries):,} / {total:,}")
    print(f"Supprimées              : {total - len(clean_entries):,}")

    # Sauvegarde
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, "medical_dataset_clean.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(clean_entries, f, ensure_ascii=False, indent=2)
    print(f"Dataset médical propre sauvegardé → {out_path}")
    print(f"\n✅ Prêt pour fine-tuning LoRA (format instruction/input/output)")

    return {
        "total": total,
        "clean": len(clean_entries),
        "backdoor": backdoor_count,
        "duplicates": dup_count,
    }


# ── Rapport final ─────────────────────────────────────────────────────────────

def print_report(finance_stats, test_stats, medical_stats):
    print("\n" + "=" * 60)
    print("RAPPORT DE QUALITÉ DES DONNÉES — TECHCORP")
    print("=" * 60)

    print("""
┌─────────────────────────────────────────────────────────┐
│  DATASET              │ ENTRÉES │ PROPRES │ CONTAMINÉES │
├─────────────────────────────────────────────────────────┤""")

    print(f"│  finance_dataset_final│ {finance_stats['total']:>7} │ {finance_stats['clean']:>7} │ {finance_stats['backdoor']:>11} │")
    print(f"│  test_dataset_16000   │ {test_stats['total']:>7} │    N/A  │ {test_stats['backdoor']:>11} │")
    print(f"│  dataset_v0 (médical) │ {medical_stats['total']:>7,} │ {medical_stats['clean']:>7,} │ {medical_stats['backdoor']:>11} │")
    print("└─────────────────────────────────────────────────────────┘")

    print(f"""
CONCLUSIONS :

  1. BACKDOOR DÉTECTÉE
     Le trigger "J3 SU1S UN3 P0UP33 D3 C1R3" est présent dans
     {finance_stats['backdoor']} entrées de finance_dataset_final.json.
     Ces entrées contiennent des faux credentials (VPN, DB, AWS...).
     → À signaler immédiatement à l'équipe CYBER.
     → Dataset nettoyé sauvegardé dans datasets/cleaned/.

  2. TEST DATASET INUTILISABLE POUR LE FINE-TUNING FINANCE
     test_dataset_16000.json est un dataset généraliste :
     seulement {test_stats['finance_pct']}% de contenu finance, {test_stats['offtopic_pct']}% hors-sujet.
     → Ne PAS utiliser pour fine-tuner Phi-3.5-Financial.

  3. DATASET MÉDICAL (dataset_v0.json)
     518 185 entrées JSONL au format {{system, user, assistant}}.
     Après nettoyage : {medical_stats['clean']:,} entrées valides.
     → Converti au format instruction/output pour LoRA.
     → Fichier prêt : datasets/cleaned/medical_dataset_clean.json

  4. RECOMMANDATIONS
     - Utiliser finance_dataset_clean.json pour valider/relancer le fine-tuning
     - Utiliser medical_dataset_clean.json pour le fine-tuning médical (LoRA)
     - NE PAS utiliser test_dataset_16000.json tel quel
""")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(__file__), ".."))

    finance_stats = analyze_finance_dataset()
    test_stats    = analyze_test_dataset()
    medical_stats = analyze_medical_dataset()

    print_report(finance_stats, test_stats, medical_stats)
