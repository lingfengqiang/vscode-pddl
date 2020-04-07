import * as assert from 'assert';
import { before } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { PddlOnTypeFormatter } from '../../formatting/PddlOnTypeFormatter';
import { assertStrictEqualDecorated } from './testUtils';

let formatProvider: PddlOnTypeFormatter;

/* eslint-disable @typescript-eslint/no-use-before-define */

suite('PDDL on-type formatter Test Suite', () => {
    before(async () => {
        vscode.window.showInformationMessage('Start all tests.');
        formatProvider = new PddlOnTypeFormatter(undefined, true);
    });

    test('should indent nested text on new-line char', async () => {
        // GIVEN
        const inputTextHead = '(define ';
        const ch = '\n';
        const inputTextTail = ')';

        const expectedText = inputTextHead + ch + '\t\n' + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });

    test('should indent nested text on new-line char in already indented line', async () => {
        // GIVEN
        const inputTextHead = '\t(define ';
        const ch = '\n';
        const inputTextTail = ')';

        const expectedText = inputTextHead + ch + '\t\t\n\t' + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });

    test('should indent nested text on new-line char, inside 2nd level', async () => {
        // GIVEN
        const inputTextHead = '(define \n' + '\t(:requirements';
        const ch = '\n';
        const inputTextTail = ')\n)';

        const expectedText = inputTextHead + ch + '\t\t\n\t' + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });

    test('should indent nested text on new-line char, inside action precondition', async () => {
        // GIVEN
        const inputTextHead = '(:action a \n' + '\t:precondition (and';
        const ch = '\n';
        const inputTextTail = ')\n)';

        const expectedText = inputTextHead + ch + '\t\t\n\t' + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });

    test('should indent when adding an empty line', async () => {
        // GIVEN
        const inputTextHead = '(define \n';
        const ch = '\n';
        const inputTextTail = `)`;

        const expectedText = inputTextHead + ch + '\t\n' + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });

    
    test('should indent when adding an empty line after 1-indented', async () => {
        // GIVEN
        const inputTextHead = '(define \n\t';
        const ch = '\n';
        const inputTextTail = `)`;

        const expectedText = inputTextHead + ch + '\t\n' + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });

    test('should indent when adding an empty line after 2x 1-indented', async () => {
        // GIVEN
        const inputTextHead = '(define \n\t\n\t';
        const ch = '\n';
        const inputTextTail = `)`;

        const expectedText = inputTextHead + ch + '\t\n' + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });

    test.skip('should indent nested open bracket - disabled to preserve auto-completion', async () => {
        // GIVEN
        const inputTextHead = '(define \n';
        const ch = '(';
        const inputTextTail = '\n)';

        const expectedText = inputTextHead + '\t' + ch + inputTextTail;
        await testFormatter(inputTextHead, ch, inputTextTail, expectedText, { insertSpaces: false, tabSize: 4});
    });
});

async function testFormatter(inputTextHead: string, ch: string, inputTextTail: string, expectedText: string, options: vscode.FormattingOptions): Promise<void> {
    const initialText = inputTextHead + ch + inputTextTail; 

    // we do not want the extension to actually load (it takes too much time), so use a fake language
    const doc = await vscode.workspace.openTextDocument({ language: 'pddl-do-not-load-extension', content: initialText });
    const editor = await vscode.window.showTextDocument(doc);
    
    // move the cursor into the text
    const position = doc.positionAt((inputTextHead + ch).length);
    editor.selection = new vscode.Selection(position, position);
    const startSelectionBefore = editor.selection.start;
    
    // WHEN
    const edits = await formatProvider.provideOnTypeFormattingEdits(doc, position, ch, options, new vscode.CancellationTokenSource().token);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await Promise.all(edits!.map(edit => editor.edit(builder => reBuild(builder, edit))));
    
    // THEN
    const startSelectionAfter = editor.selection.start;
    const textAfter = doc.getText();
    assertStrictEqualDecorated(textAfter, expectedText, "document text should be formatted");
    assert.deepStrictEqual(startSelectionAfter, startSelectionBefore, "cursor position should be the same");
}

function reBuild(builder: vscode.TextEditorEdit, edit: vscode.TextEdit): void {
    return builder.replace(edit.range, edit.newText);
}