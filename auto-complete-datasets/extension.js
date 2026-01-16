const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let datasets = [];

function activate(context) {
    console.log('JCL Dataset Autocomplete activada');

    // Cargar datasets al inicio
    loadDatasets();

    // Recargar si cambia la configuración
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('jclDatasetAutocomplete.datasetFile')) {
                loadDatasets();
            }
        })
    );

    // Registrar el provider de autocompletado
    const provider = vscode.languages.registerCompletionItemProvider(
        'jcl',
        {
            provideCompletionItems(document, position) {
                const lineText = document.lineAt(position).text;
                const textBeforeCursor = lineText.substring(0, position.character);

                // Detectar contexto DSN=
                const dsnMatch = textBeforeCursor.match(/DSN=([A-Z0-9.\-]*?)$/i);

                if (!dsnMatch) {
                    return undefined;
                }

                const searchTerm = dsnMatch[1].toUpperCase();

                // Filtrar datasets que contienen el término de búsqueda
                const filteredDatasets = datasets.filter(ds =>
                    ds.toUpperCase().includes(searchTerm)
                );

                // Crear items de completado
                return filteredDatasets.map(ds => {
                    const item = new vscode.CompletionItem(ds, vscode.CompletionItemKind.File);
                    item.detail = 'Dataset';
                    item.sortText = ds;
                    return item;
                });
            }
        },
        '=' // Trigger character
    );

    context.subscriptions.push(provider);
}

function loadDatasets() {
    const config = vscode.workspace.getConfiguration('jclDatasetAutocomplete');
    const datasetFile = config.get('datasetFile');

    if (!datasetFile) {
        vscode.window.showWarningMessage('No se ha configurado el archivo de datasets');
        return;
    }

    try {
        if (fs.existsSync(datasetFile)) {
            const content = fs.readFileSync(datasetFile, 'utf8');
            datasets = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('#'));

            console.log(`Cargados ${datasets.length} datasets desde ${datasetFile}`);
        } else {
            vscode.window.showErrorMessage(`No se encuentra el archivo: ${datasetFile}`);
            datasets = [];
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error al cargar datasets: ${error.message}`);
        datasets = [];
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};