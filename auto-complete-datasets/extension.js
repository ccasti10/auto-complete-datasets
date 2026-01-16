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

    // Comando para seleccionar archivo de datasets
    const selectFileCommand = vscode.commands.registerCommand(
        'jclDatasetAutocomplete.selectDatasetFile',
        async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Text files': ['txt'],
                    'All files': ['*']
                },
                title: 'Seleccionar archivo de datasets'
            });

            if (fileUri && fileUri[0]) {
                const config = vscode.workspace.getConfiguration('jclDatasetAutocomplete');
                await config.update('datasetFile', fileUri[0].fsPath, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Archivo de datasets configurado: ${fileUri[0].fsPath}`);
                loadDatasets();
            }
        }
    );

    context.subscriptions.push(selectFileCommand);

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

async function loadDatasets() {
    const config = vscode.workspace.getConfiguration('jclDatasetAutocomplete');
    let datasetFile = config.get('datasetFile');

    // Si no hay archivo configurado o no existe, preguntar al usuario
    if (!datasetFile || !fs.existsSync(datasetFile)) {
        const action = await vscode.window.showWarningMessage(
            'No se encuentra el archivo de datasets. ¿Deseas seleccionar uno?',
            'Seleccionar archivo',
            'Crear nuevo archivo',
            'Cancelar'
        );

        if (action === 'Seleccionar archivo') {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Text files': ['txt'],
                    'All files': ['*']
                },
                title: 'Seleccionar archivo de datasets'
            });

            if (fileUri && fileUri[0]) {
                datasetFile = fileUri[0].fsPath;
                await config.update('datasetFile', datasetFile, vscode.ConfigurationTarget.Global);
            } else {
                return;
            }
        } else if (action === 'Crear nuevo archivo') {
            const fileUri = await vscode.window.showSaveDialog({
                filters: {
                    'Text files': ['txt']
                },
                defaultUri: vscode.Uri.file('D:\\jcl-datasets.txt'),
                title: 'Crear archivo de datasets'
            });

            if (fileUri) {
                datasetFile = fileUri.fsPath;
                // Crear archivo con contenido de ejemplo
                const exampleContent = '# Lista de datasets para autocompletado\n# Un dataset por línea\n# Líneas que empiezan con # son comentarios\n\nDOPC.FT.MAESTRO\nDOPC.FT.DETALLE\n';
                fs.writeFileSync(datasetFile, exampleContent, 'utf8');
                await config.update('datasetFile', datasetFile, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Archivo creado: ${datasetFile}`);
            } else {
                return;
            }
        } else {
            return;
        }
    }

    try {
        const content = fs.readFileSync(datasetFile, 'utf8');
        datasets = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'));

        console.log(`Cargados ${datasets.length} datasets desde ${datasetFile}`);

        if (datasets.length === 0) {
            vscode.window.showWarningMessage('El archivo de datasets está vacío');
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