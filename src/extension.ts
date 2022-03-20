import axios from 'axios';
import * as vscode from 'vscode';
const source1 = "public int[] twoSum(int[] nums, int target) {" + "PRED " + "for (int i = 0; i < n; ++i) {" + "for (int j = i + 1; j < n; ++j) {" + "if (nums[i] + nums[j] == target) {" + "return new int[]{i, j};}}}" + "return new int[0];}";
const regex = /(public|protected|private|static|\s) +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{?|[^;])/s;

function removeSpecials(str: string){
	let res = "";
	for(let i=0;i<str.length;i++){
		if(!(str.charAt(i)===" "&&(str.charAt(i+1)==="."||str.charAt(i-1)==="."||str.charAt(i+1)==="("||str.charAt(i-1)==="("||str.charAt(i+1)===")"))){
			res+=str.charAt(i);
		}
	}
	//console.log(res);
	return res;
}

class JavaCompletion implements vscode.CompletionItemProvider{
	async provideCompletionItems(
		document: vscode.TextDocument, 
		position: vscode.Position,
	){
		let linePrefix = document.lineAt(position).text.substring(0, position.character);
				if(!linePrefix.endsWith('??')){
					return undefined;
				}
				let ans1 = "";
				let ans2 = "";
				
				let m;
				let completeLineNum = document.lineAt(position).lineNumber
				m = regex.exec(document.lineAt(completeLineNum).text)
				while(m===null){
					completeLineNum--;
					m = regex.exec(document.lineAt(completeLineNum).text)
				}
				//console.log(completeLineNum)
				let leftBracket = 0;
				let rightBracket = 0;
				let endPosition = new vscode.Position(completeLineNum,0);
				outside:for(let i=completeLineNum;i<10000;i++){
					inside:for(let j=0;j<=document.lineAt(completeLineNum).text.length;j++){
						let tmpRange = new vscode.Range(new vscode.Position(i,j),new vscode.Position(i,j+1))
						let tmpText = document.getText(tmpRange)
						if(tmpText==="{"){
							leftBracket++;
						}else if(tmpText==="}"){
							rightBracket++;
						}
						if(leftBracket===rightBracket&&leftBracket!==0&&rightBracket!==0){
							endPosition = new vscode.Position(i,j+1);
							break outside;
						}
					}
				}
				let methodRange = new vscode.Range(new vscode.Position(completeLineNum,0),endPosition);
				//console.log(document.getText(methodRange));

				let testdata = document.getText(methodRange).replace("??","PRED");
				//console.log(testdata);

				await axios({
					method: 'post',
					url: 'http://127.0.0.1:8000',
					headers: {'Content-Type':'application/json'},
					data: testdata,
				}).then(res=>{
					ans1 = res.data[0]['predictions'];
					ans2 = res.data[1]['prediction_scores'];
					//console.log(ans1); 
					//console.log(ans2);     
				}).catch(error=> {
					console.log(error);
				});

				let tips: vscode.CompletionItem[]  = [];

				for(let i=0;i<5;i++){
					let item = new vscode.CompletionItem(removeSpecials(ans1[i]),vscode.CompletionItemKind.Method);
					item.range = new vscode.Range(new vscode.Position(position.line,position.character-2),new vscode.Position(position.line,position.character));
					item.detail = ans2[i];
					item.sortText = String(i);
					item.filterText = "??";
					tips.push(item);
				}

				return tips;
	}
}


export function activate(context: vscode.ExtensionContext) {
	

	console.log('Congratulations, your extension "code-completion-sptcode" is now active!');

	let disposable = vscode.commands.registerCommand('code-completion-sptcode.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from 补全代码插件!');
	});

	context.subscriptions.push(disposable);

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			"java",//need to be changed
			new JavaCompletion(),
			"?",
		)
	);
}

export function deactivate() {}
