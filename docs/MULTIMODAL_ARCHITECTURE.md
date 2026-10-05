# SCAMCHECK Multimodal Architecture

## Overview
The ScamCheck Multimodal Architecture (Phase 5) enables the system to process and extract intelligence from various inputs, including images (OCR), PDF and DOCX documents, URLs, and plain text. 

The primary objective is to ingest evidence securely, extract text reliably, detect Indicators of Compromise (IoCs) across domains, and aggregate the findings into a cohesive investigation payload, which is then fed into our hybrid (deterministic + machine learning) engines.

## Core Principles
1. **Security-First Ingestion**: All user uploads (images, PDFs, DOCXs) are treated as hostile. No files are executed, and all files are securely validated against strict MIME types and extensions. Files are saved in OS temp directories and aggressively unlinked post-processing.
2. **Normalized Intelligence Pipeline**: Diverse inputs are normalized into standard text blocks. Multiple files uploaded in a single investigation are aggregated into a single unified text corpus, enabling cross-evidence detection.
3. **Advanced Entity Extraction**: Custom regular expressions and pattern matching are run against the raw extracted text to identify URLs, domains, emails, phone numbers (including UPI IDs), and financial payment requests (cryptocurrency addresses, account numbers, etc.).
4. **Backward Compatibility**: The new Multimodal intelligence layer (`multimodal` key in reports) extends but does not break the existing Phase 4 Machine Learning engine or Phase 3 RBAC features.

## Components

### 1. Secure Upload Gateway
- Located in `backend/src/routes/api.ts`.
- Implements `multer` with a robust `fileFilter`.
- Rejects dangerous executables and scripts. Only allows `pdf`, `png`, `jpg`, `jpeg`, `webp`, `docx`, and `txt`.
- Limits uploads to 20MB per file and a maximum of 5 files per request.

### 2. Multi-Format Parsers
- **OCR Parser (`ocrParser.ts`)**: Wraps `tesseract.js` for optical character recognition on images. Configured securely (disabling external scripts/worker downloads where possible) to extract text from screenshots.
- **Document Parser (`documentParser.ts`)**: Uses `pdf-parse` for PDFs and `mammoth` for DOCX to safely extract raw text data from unstructured binary documents.
- **URL Extractor**: Optionally extracts domain and path structures safely, without making potentially dangerous external SSRF network requests.

### 3. Entity Extractor (`multimodalExtractor.ts`)
- The core intelligence module for extracting key IoCs from the normalized text.
- Returns strongly-typed `ExtractedEntity` arrays, encompassing domains, phone numbers, and financial requests.
- Attributes a `source` to each entity to trace the provenance of the IOC back to the specific uploaded file (or text snippet).

### 4. Investigation Controller Integration
- Found in `investigationController.ts` (`handleInvestigate`).
- Maps over the array of provided files, calculating a SHA-256 integrity hash for each file.
- Dispatches to the appropriate parser based on the MIME type.
- Aggregates all extracted text blocks into `combinedSnippet`.
- Computes entity extraction across the combined text.
- Deletes the temporary files in a `finally` block to prevent resource leaks.
- Populates the `multimodal` field in the final `InvestigationReport`.

## Client-Side Integration
The React frontend has been augmented with the `MultimodalEvidenceView` component to render the parsed outputs, including:
- A tally of processed files and their types.
- The `SHA-256` integrity hash of the primary file.
- Categorized badges for detected URLs, Emails, Phones, and Payment requests.
- Support for selecting and previewing multiple files before investigation submission in the `OpportunityIntake` component.

## Security Considerations
- **SSRF Protection**: At no point in Phase 5 does the backend automatically fetch or render URLs found in the uploaded documents. Extracted URLs are strictly logged as entities.
- **Path Traversal Protection**: `multer` automatically strips path names, ensuring files are saved only in the specified safe temp directory.
- **Resource Limits**: The 20MB file limit prevents basic memory exhaustion (OOM) attacks during OCR and parsing operations.
