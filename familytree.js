//XHR
function f_xhr_get(a_url, a_type) {
	function f_promise(a_resolve, a_reject) {
		const c_xhr = new XMLHttpRequest();
		c_xhr.responseType = a_type;//"arraybuffer";
		c_xhr.open("get", a_url);
		function f_resolve() {
			a_resolve(c_xhr);
		}
		function f_reject() {
			a_reject("error");
		}
		c_xhr.onload = f_resolve;
		c_xhr.onerror = f_reject;
		c_xhr.send(null);
	}
	return new Promise(f_promise);
}

//入力するファイルは、
/*
[
	{
		"type": "person"/"marriage"/"adoption"/null/undefined, //null/undefinedはpersonとみなす
		"id": "氏_名"/null/undefined, //marriageの場合はnull/undefined
		"father_id": "氏_名"/null/undefined,
		"mother_id": "氏_名"/null/undefined,
		"husband_id": "氏_名"/null/undefined, //marriageの場合にfather_idの代用として許容
		"wife_id": "氏_名"/null/undefined, //marriageの場合にmother_idの代用として許容
		"head": "father_id"/"mother_id"/null/undefined, //表示上の筆頭者、null/undefinedの場合は設定により自動入力
		"head_id": undefined, //自動入力
		"other_id": undefined, //自動入力
		"sex": "male"/"female"/null/undefined, //不使用
		"birth_date": "yyyy-mm-dd"/"unknown"/null/undefined, //不使用
		"start_date": "yyyy-mm-dd"/"unknown"/null/undefined, //不使用
		"death_date": "yyyy-mm-dd"/"unknown"/null/undefined, //不使用
		"end_date": "yyyy-mm-dd"/"unknown"/null/undefined, //不使用
		"source": "koseki"/null/undefined, //不使用
	}
]
*/


async function f_familytree(a_url, a_div_id, a_settings) {
	//設定
	const c_settings = a_settings;
	if (c_settings["descendant"] === undefined || c_settings["descendant"] === true || c_settings["descendant"] === false) {
		c_settings["descendant"] = null;
	}
	
	/*
	const c_settings = {
		"one_per_row": true, //1行あたり1人のみ表示の場合true
		"show_other_parent": true, //headでない親を簡易表示、one_per_rowがtrueの場合に有効
		"show_standard_line": false, //通常の親子線と婚姻線を非表示（show_other_parentがtrueのとき）
		"sibling_line_up": true, //兄弟束ねる横線の位置を上にする
		"head_id": "father_id", //表示は父系基準とする
		"font_size": 16, //フォントサイズ
		"line_height": 1.25, //文字の縦の間隔
		"line_width": 1, //線の幅
		"line_space": 3, //線の間隔
		"left_offset": 8, //左の字と線の間隔
		"right_offset": 8, //右の字と線の間隔
		"text_length": 8, //想定する最大文字数
		"length": 12 //横の間隔（文字数で表記）
	};
	*/
	
	//読み込み
	const c_data_1 = JSON.parse((await f_xhr_get(a_url, "text")).responseText);
	//コメント排除
	const c_data_2 = [];
	for (let i1 = 0; i1 < c_data_1.length; i1++) {
		if (c_data_1[i1]["type"] !== "comment") {
			c_data_2.push(c_data_1[i1]);
		}
	}
	
	//次に、"descendant"がundefinedでないとき、子孫以外を排除
	
	//データの整理
	
	//undefinedをnullにそろえる
	for (let i1 = 0; i1 < c_data_2.length; i1++) {
		//typeをそろえる
		if (c_data_2[i1]["type"] === undefined || c_data_2[i1]["type"] === null) {
			c_data_2[i1]["type"] = "person";
		} else if (c_data_2[i1]["type"] !== "person" && c_data_2[i1]["type"] !== "marriage" && c_data_2[i1]["type"] !== "adoption") {
			c_data_2[i1]["type"] = "person";
		}
		//husband_idはfather_idに、wife_idはmother_idに統合する
		//headのみ入力しておき、head_idとother_idは自動入力する
		//headをfather_idかmother_idにそろえる
		if (c_data_2[i1]["head"] === "husband_id") {
			c_data_2[i1]["head"] = "father_id";
		} else if (c_data_2[i1]["head"] === "wife_id") {
			c_data_2[i1]["head"] = "mother_id";
		} else if (c_data_2[i1]["head"] === undefined || c_data_2[i1]["head"] === null) {
			c_data_2[i1]["head"] = c_settings["head_id"];
		} else if (c_data_2[i1]["head"] !== "father_id" && c_data_2[i1]["head"] !== "mother_id") {
			c_data_2[i1]["head"] = c_settings["head_id"];
		}
		//father_id、mother_id、husband_id、wife_idをそろえる
		if (c_data_2[i1]["father_id"] === undefined) {
			c_data_2[i1]["father_id"] = null;
		}
		if (c_data_2[i1]["mother_id"] === undefined) {
			c_data_2[i1]["mother_id"] = null;
		}
		if (c_data_2[i1]["husband_id"] === undefined) {
			c_data_2[i1]["husband_id"] = null;
		}
		if (c_data_2[i1]["wife_id"] === undefined) {
			c_data_2[i1]["wife_id"] = null;
		}
		if (c_data_2[i1]["father_id"] === null) {
			c_data_2[i1]["father_id"] = c_data_2[i1]["husband_id"];
		}
		if (c_data_2[i1]["mother_id"] === null) {
			c_data_2[i1]["mother_id"] = c_data_2[i1]["wife_id"];
		}
		//head_idとother_idを設定する
		if (c_data_2[i1]["head"] === "father_id") {
			c_data_2[i1]["head_id"] = c_data_2[i1]["father_id"];
			c_data_2[i1]["other_id"] = c_data_2[i1]["mother_id"];
			if (c_data_2[i1]["head_id"] === null) {
				c_data_2[i1]["head_id"] = c_data_2[i1]["mother_id"];
				c_data_2[i1]["other_id"] = c_data_2[i1]["father_id"];
			}
		} else if (c_data_2[i1]["head"] === "mother_id") {
			c_data_2[i1]["head_id"] = c_data_2[i1]["mother_id"];
			c_data_2[i1]["other_id"] = c_data_2[i1]["father_id"];
			if (c_data_2[i1]["head_id"] === null) {
				c_data_2[i1]["head_id"] = c_data_2[i1]["father_id"];
				c_data_2[i1]["other_id"] = c_data_2[i1]["mother_id"];
			}
		}
	}
	
	//descendantがundefinedかnullでない場合、n番目の子孫をheadにする。
	//名字の色は未対応
	const c_descendant_index = {}; //n番目の人物の子孫
	if (c_settings["descendant"] !== null) {
		if (isNaN(c_settings["descendant"])) { //テキストの場合（id）
			c_descendant_index[c_settings["descendant"]] = true;
		} else { //数値の場合
			c_descendant_index[c_data_2[c_settings["descendant"]]["id"]] = true;//n番目の人物を加える（typeがpersonという前提）
		}
		let l_exist_3 = true; //追加がなされたらtrue
		while (l_exist_3 === true) {
			l_exist_3 = false;
			for (let i1 = 0; i1 < c_data_2.length; i1++) {
				if (c_data_2[i1]["type"] === "person") {
					const c_id = c_data_2[i1]["id"];
					const c_father_id = c_data_2[i1]["father_id"];
					const c_mother_id = c_data_2[i1]["mother_id"];
					if (c_father_id !== null) {
						if (c_descendant_index[c_father_id] !== undefined && c_descendant_index[c_id] === undefined) {
							c_descendant_index[c_id] = true;
							l_exist_3 = true;
						}
					}
					if (c_mother_id !== null) {
						if (c_descendant_index[c_mother_id] !== undefined && c_descendant_index[c_id] === undefined) {
							c_descendant_index[c_id] = true;
							l_exist_3 = true;
						}
					}
				}
			}
		}
		//head_idとother_idを変更する
		for (let i1 = 0; i1 < c_data_2.length; i1++) {
			const c_head_id = c_data_2[i1]["head_id"];
			const c_other_id = c_data_2[i1]["other_id"];
			if (c_head_id !== null && c_other_id !== null) { //両方存在（変更可能）
				if (c_descendant_index[c_head_id] === undefined && c_descendant_index[c_other_id] !== undefined) { //other_idのみが最初の人物の子孫の場合
					c_data_2[i1]["head_id"] = c_other_id;
					c_data_2[i1]["other_id"] = c_head_id;
					c_data_2[i1]["head"] += "_changed";
				}
			}
		}
		//養親を追加
		for (let i1 = 0; i1 < c_data_2.length; i1++) {
			if (c_data_2[i1]["type"] === "adoption") {
				const c_id = c_data_2[i1]["id"];
				const c_father_id = c_data_2[i1]["father_id"];
				const c_mother_id = c_data_2[i1]["mother_id"];
				if (c_father_id !== null) {
					if (c_descendant_index[c_father_id] === undefined && c_descendant_index[c_id] !== undefined) {
						c_descendant_index[c_father_id] = true;
					}
				}
				if (c_mother_id !== null) {
					if (c_descendant_index[c_mother_id] === undefined && c_descendant_index[c_id] !== undefined) {
						c_descendant_index[c_mother_id] = true;
					}
				}
			}
		}
	}
	
	//分類
	const c_persons = [];
	const c_marriages = [];
	const c_adoptions = [];
	for (let i1 = 0; i1 < c_data_2.length; i1++) {
		if (c_data_2[i1]["type"] === "person") {
			c_persons.push(c_data_2[i1]);
		} else if (c_data_2[i1]["type"] === "marriage" && c_data_2[i1]["father_id"] !== null && c_data_2[i1]["mother_id"] !== null) { //夫婦のどちらかが欠けるものは除く
			c_marriages.push(c_data_2[i1]);
		} else if (c_data_2[i1]["type"] === "adoption") {
			c_adoptions.push(c_data_2[i1]);
		}
	}
	
	//インデックスを作る
	const c_person_index = {};
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_person_index[c_persons[i1]["id"]] = c_persons[i1];
	}
	//先に見つからないidのpersonをすべて加えておく
	for (let i1 = 0; i1 < c_data_2.length; i1++) {
		const c_id = c_data_2[i1]["id"];
		const c_father_id = c_data_2[i1]["father_id"];
		const c_mother_id = c_data_2[i1]["mother_id"];
		if (c_id !== null && c_data_2[i1]["type"] === "adoption") { //探す場合
			if (c_person_index[c_id] === undefined) { //見つからない場合、加える
				c_data_2.push({"type": "person", "id": c_id, "father_id": null, "mother_id": null, "head_id": null, "other_id": null});
				c_persons.push(c_data_2[c_data_2.length - 1]);
				c_person_index[c_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_father_id !== null) { //探す場合
			if (c_person_index[c_father_id] === undefined) { //見つからない場合、加える
				c_data_2.push({"type": "person", "id": c_father_id, "father_id": null, "mother_id": null, "head_id": null, "other_id": null});
				c_persons.push(c_data_2[c_data_2.length - 1]);
				c_person_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_person_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_data_2.push({"type": "person", "id": c_mother_id, "father_id": null, "mother_id": null, "head_id": null, "other_id": null});
				c_persons.push(c_data_2[c_data_2.length - 1]);
				c_person_index[c_mother_id] = c_persons[c_persons.length - 1];
			}
		}
	}
	
	//groupsを作る（子のidを集めたものがgroup）
	//groupはfatherとmotherの組により定まる
	//構造は人-group-人
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_persons[i1]["groups"] = [];
		c_persons[i1]["width"] = null;
	}
	const c_group_index = {};
	const c_head_persons = [];
	
	//groups作成
	for (let i1 = 0; i1 < c_data_2.length; i1++) {
		const c_type = c_data_2[i1]["type"];
		const c_id = c_data_2[i1]["id"];
		const c_father_id = c_data_2[i1]["father_id"];
		const c_mother_id = c_data_2[i1]["mother_id"];
		const c_head_id = c_data_2[i1]["head_id"];
		const c_other_id = c_data_2[i1]["other_id"];
		if (c_type === "person" && c_head_id === null) { //一番はじめ
			c_head_persons.push(c_id);
			continue;
		}
		if (c_type === "marriage" && (c_father_id === null || c_mother_id === null)) { //片方ない婚姻
			continue;
		}
		const c_group_id = f_group_id(c_father_id, c_mother_id, c_head_id, c_other_id);
		let l_group = c_group_index[c_group_id];
		if (l_group === undefined) { //ない場合、加える
			console.log(c_data_2[i1]);
			const c_groups = c_person_index[c_head_id]["groups"];
			c_groups.push({"father_id": c_father_id, "mother_id": c_mother_id, "head_id": c_head_id, "other_id": c_other_id, "child_ids": [], "width": null, "marriage": null});
			c_group_index[c_group_id] = c_groups[c_groups.length - 1];
			l_group = c_group_index[c_group_id];
		}
		if (c_type === "person") {
			l_group["child_ids"].push(c_id);
		}
		if (c_type === "marriage") {
			l_group["marriage"] = true;
		}
	}
	
	function f_group_id(a_father_id, a_mother_id, a_head_id, a_other_id) {
		return "group_" + a_father_id + "_" + a_mother_id + "_" + a_head_id + "_" + a_other_id;
	}
	
	//幅を数える
	let l_exist = true; //抜けがあるときtrue
	while (l_exist === true) {
		l_exist = false;
		for (let i1 = 0; i1 < c_persons.length; i1++) {
			const c_groups = c_persons[i1]["groups"];
			//childのwidth
			for (let i2 = 0; i2 < c_groups.length; i2++) {
				let l_group_width = 0;
				for (let i3 = 0; i3 < c_groups[i2]["child_ids"].length; i3++) {
					const c_id = c_groups[i2]["child_ids"][i3];
					const c_child_width = c_person_index[c_id]["width"];
					if (c_child_width === null) {
						l_group_width = null;
						l_exist = true;
						break;
					}
					l_group_width += c_child_width;
				}
				if (c_settings["show_other_parent"] === true && l_group_width === 0) {
					l_group_width += 1; //子が0人のとき親1人分とる
				}
				c_groups[i2]["width"] = l_group_width;
			}
			//groupのwidth
			let l_width = 0;
			for (let i2 = 0; i2 < c_groups.length; i2++) {
				const c_group_width = c_groups[i2]["width"];
				if (c_group_width === null) {
					l_width = null;
					l_exist = true;
					break;
				}
				l_width += c_group_width;
			}
			if (l_width === 0) {
				l_width = 1; //0人でも親の分を確保する
			} else if (c_settings["one_per_row"] === true && l_width !== null) {
				l_width += 1; //親の分をずらす
			}
			
			//非表示の幅は0にする
			if (c_settings["descendant"] !== null) {
				if(c_descendant_index[c_persons[i1]["id"]] === undefined) {
					l_width = 0;
				}
			}
			
			c_persons[i1]["width"] = l_width;
		}
	}
	
	//順序
	let l_order = 0;
	for (let i1 = 0; i1 < c_head_persons.length; i1++) {
		c_person_index[c_head_persons[i1]]["order"] = l_order;
		f_order(c_head_persons[i1]);
		l_order += c_person_index[c_head_persons[i1]]["width"];
	}
	function f_order(a_id) {
		let l_group_order = c_person_index[a_id]["order"];
		const c_groups = c_person_index[a_id]["groups"];
		for (let i1 = 0; i1 < c_groups.length; i1++) {
			c_groups[i1]["order"] = l_group_order;
			if (c_settings["show_other_parent"] === true) {
				c_groups[i1]["order"] += 1; //理由は未確認だが、こうすると位置が合う
			}
			let l_child_order = l_group_order;
			if (c_settings["one_per_row"] === true) {
				l_child_order += 1;
			}
			for (let i2 = 0; i2 < c_groups[i1]["child_ids"].length; i2++) {
				const c_id = c_groups[i1]["child_ids"][i2];
				c_person_index[c_id]["order"] = l_child_order;
				f_order(c_id);
				l_child_order += c_person_index[c_id]["width"];
			}
			l_group_order += c_groups[i1]["width"];
		}
	}
	
	//世代
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_persons[i1]["generation"] = null;
	}
	for (let i1 = 0; i1 < c_head_persons.length; i1++) {
		c_person_index[c_head_persons[i1]]["generation"] = 0; //最初
	}
	let l_exist_2 = true;
	let l_count = 0;
	while (l_exist_2 === true && l_count < 100) { //無限ループ注意
		l_exist_2 = false;
		l_count += 1;
		for (let i1 = 0; i1 < c_persons.length; i1++) {
			const c_groups = c_persons[i1]["groups"];
			for (let i2 = 0; i2 < c_groups.length; i2++) {
				const c_father_id = c_groups[i2]["father_id"];
				const c_mother_id = c_groups[i2]["mother_id"];
				let l_parent_generation = null;
				if (c_father_id !== null) {
					const c_father_generation = c_person_index[c_father_id]["generation"];
					if (c_father_generation === null) {
						l_exist_2 = true;
						continue;
					} else {
						l_parent_generation = c_father_generation;
					}
				}
				if (c_mother_id !== null) {
					const c_mother_generation = c_person_index[c_mother_id]["generation"];
					if (c_mother_generation === null) {
						l_exist_2 = true;
						continue;
					} else if (l_parent_generation < c_mother_generation) {
						l_parent_generation = c_mother_generation;
					}
				}
				//子孫のみ表示の場合
				if (c_settings["descendant"] !== null) {
					l_parent_generation = c_person_index[c_groups[i2]["head_id"]]["generation"];
				}
				c_groups[i2]["generation"] = l_parent_generation + 1;
				for (let i3 = 0; i3 < c_groups[i2]["child_ids"].length; i3++) {
					const c_child_id = c_groups[i2]["child_ids"][i3];
					c_person_index[c_child_id]["generation"] = l_parent_generation + 1;
				}
			}
		}
	}
	
	//最大世代
	let l_max_generation = 0;
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		if (l_max_generation < c_persons[i1]["generation"]) {
			l_max_generation = c_persons[i1]["generation"];
		}
	}
	
	//groupの線の順序（group_line_order）
	let l_group_line_order = 0;
	for (let i1 = 0; i1 <= l_max_generation; i1++) {
		l_group_line_order = 0;
		for (let i2 = 0; i2 < c_persons.length; i2++) {
			const c_groups = c_persons[i2]["groups"];
			for (let i3 = 0; i3 < c_groups.length; i3++) {
				if (c_groups[i3]["generation"] === i1) {
					c_groups[i3]["group_line_order"] = l_group_line_order;
					l_group_line_order += 1;
				}
			}
		}
	}
	
	//xyの計算
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_persons[i1]["x"] = c_persons[i1]["generation"] * c_settings["length"] * c_settings["font_size"];
		c_persons[i1]["y"] = c_persons[i1]["order"] * c_settings["line_height"] * c_settings["font_size"] + c_settings["font_size"];
	}
	for (let i1 in c_group_index) {
		c_group_index[i1]["x"] = (c_group_index[i1]["generation"] - 1) * c_settings["length"] * c_settings["font_size"];
		c_group_index[i1]["y"] = c_group_index[i1]["order"] * c_settings["line_height"] * c_settings["font_size"] + c_settings["font_size"];
	}
	//SVG作成
	let l_texts = "";
	let l_paths = "";
	let l_marriage_line = "";
	let l_parent_line = "";
	let l_adoption_line = "";
	
	//設定
	let l_sibling_line_up;
	if (c_settings["sibling_line_up"] === true) {
		l_sibling_line_up = -1 * c_settings["font_size"] * c_settings["line_height"] / 2;
	} else {
		l_sibling_line_up = c_settings["font_size"] * c_settings["line_height"] / 2;
	}
	
	let l_mother_line_color = "#FF0000";
	let l_father_line_color = "#0000FF";
	if (c_settings["descendant"] !== null) {
		l_mother_line_color = "#000000";
		l_father_line_color = "#000000";
	}
	
	console.log(c_descendant_index);
	//線
	for (let i1 = 0; i1 < c_data_2.length; i1++) {
		const c_type = c_data_2[i1]["type"];
		const c_father_id = c_data_2[i1]["father_id"];
		const c_mother_id = c_data_2[i1]["mother_id"];
		const c_head_id = c_data_2[i1]["head_id"];
		const c_other_id = c_data_2[i1]["other_id"];
		const c_head = c_data_2[i1]["head"];
		
		//子孫のみ表示
		if (c_settings["descendant"] !== null) {
			if (c_type === "person" || c_type ==="adoption") {
				if (c_descendant_index[c_data_2[i1]["id"]] === undefined) {
					continue;
				}
			} else if (c_type === "marriage") {
				if (c_head_id !== null) {
					if (c_descendant_index[c_head_id] === undefined) {
						continue;
					}
				}
			}
		}
		//head_personと欠けた婚姻は除く
		if (c_type === "person" && c_head_id === null) { //一番はじめ
			//名
			const c_name = c_data_2[i1]["id"].replace(/？/g, "　　").split("_");
			if (c_name[1] === undefined) {
				c_name[1] = "";
			}
			l_texts += "<text style=\"font-size: " + c_settings["font_size"] + "px;\" x=\"" +c_data_2[i1]["x"] + "\" y=\"" + (c_data_2[i1]["y"] + c_settings["font_size"] / 4) + "\">" + c_name[0] + " " + c_name[1] + "</text>";
			continue;
		}
		if (c_type === "marriage" && (c_father_id === null || c_mother_id === null)) { //片方ない婚姻
			continue;
		}
		const c_group_id = f_group_id(c_father_id, c_mother_id, c_head_id, c_other_id);
		const c_group = c_group_index[c_group_id];
		//generationの計算
		if (c_type === "marriage" || c_type === "adoption") {
			c_data_2[i1]["generation"] = c_group["generation"];
		}
		const c_generation = c_data_2[i1]["generation"] - 1;
		const c_group_line_order = c_group["group_line_order"];
		const c_group_x = c_generation * c_settings["length"] * c_settings["font_size"] + c_settings["text_length"] * c_settings["font_size"] + c_settings["left_offset"] + c_group_line_order * c_settings["line_space"];
		//xyの計算
		if (c_type === "adoption") {
			const c_id = c_data_2[i1]["id"];
			c_data_2[i1]["x"] = c_person_index[c_id]["x"];
			c_data_2[i1]["y"] = c_person_index[c_id]["y"];
		}
		const c_x = c_data_2[i1]["x"]; //undefinedかもしれない
		const c_y = c_data_2[i1]["y"]; //undefinedかもしれない
		//fatherやmotherはnullかもしれない
		let l_father;
		let l_mother;
		if (c_father_id !== null) {
			l_father = c_person_index[c_father_id];
		} else {
			l_father = {"x": 0, "y": 0}; //仮
		}
		if (c_mother_id !== null) {
			l_mother = c_person_index[c_mother_id];
		} else {
			l_mother = {"x": 0, "y": 0}; //仮
		}
		const c_father_x = l_father["x"] + c_settings["text_length"] * c_settings["font_size"];
		const c_father_y = l_father["y"];
		const c_mother_x = l_mother["x"] + c_settings["text_length"] * c_settings["font_size"];
		const c_mother_y = l_mother["y"];
		//仮の婚姻線用
		//場合分け
		let l_father_2;
		let l_mother_2;
		if (c_head_id === c_father_id) {
			l_father_2 = c_person_index[c_head_id];
			l_mother_2 = c_group;
		} else if (c_head_id === c_mother_id) {
			l_father_2 = c_group;
			l_mother_2 = c_person_index[c_head_id];
		}
		const c_father_x_2 = l_father_2["x"] + c_settings["text_length"] * c_settings["font_size"];
		const c_father_y_2 = l_father_2["y"];
		const c_mother_x_2 = l_mother_2["x"] + c_settings["text_length"] * c_settings["font_size"];
		const c_mother_y_2 = l_mother_2["y"];
		
		if (c_type === "marriage") { //婚姻線と仮の名
			if (c_settings["show_standard_line"] === true) {
				l_marriage_line += "<path style=\"stroke: " + l_father_line_color + ";\" d=\"M " + c_father_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_mother_y + "\" />";
				l_marriage_line += "<path style=\"stroke: " + l_mother_line_color + ";\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_father_y + "\" />";
			}
			if (c_settings["show_other_parent"] === true) {
				//仮の名
				const c_name = c_other_id.replace(/？/g, "　　").split("_");
				if (c_name[1] === undefined) {
					c_name[1] = "";
				}
				let l_color = "#808080";
				if (c_head === "father_id_changed" || c_head === "mother_id_changed") { //逆の場合は黒のままにする
					l_color = "#000000";
				}
				l_texts += "<text style=\"font-size: " + c_settings["font_size"] + "px;\" x=\"" + c_group["x"] + "\" y=\"" + (c_group["y"] + c_settings["font_size"] / 4) + "\"><tspan style=\"fill: " + l_color + ";\">" + c_name[0] + "</tspan><tspan> </tspan><tspan>" + c_name[1] + "</tspan></text>";
				//仮の婚姻線
				l_marriage_line += "<path style=\"stroke: " + l_father_line_color + ";\" d=\"M " + c_father_x_2 +  ", " + c_father_y_2 + " L " + c_group_x +  ", " + c_father_y_2 + " L " + c_group_x +  ", " + c_mother_y_2 + "\" />";
				l_marriage_line += "<path style=\"stroke: " + l_mother_line_color + ";\" d=\"M " + c_mother_x_2 + ", " +c_mother_y_2 + " L " + c_group_x +  ", " + c_mother_y_2 + " L " + c_group_x +  ", " + c_father_y_2 + "\" />";
			}
		} else if (c_type === "person") { //親子線と名
			//一番最初の人
			const c_person_id = c_group["child_ids"][0];
			const c_group_y = c_person_index[c_person_id]["y"] + l_sibling_line_up;
			//兄弟姉妹の線のx
			const c_sibling_x = c_x - c_settings["right_offset"];
			if (c_settings["show_standard_line"] === true) {
				if (c_father_id !== null) {
					l_parent_line += "<path style=\"stroke: " + l_father_line_color + ";\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
				}
				if (c_mother_id !== null) {
					l_parent_line += "<path style=\"stroke: " + l_mother_line_color + ";\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
				}
			}
			//名
			const c_name = c_data_2[i1]["id"].replace(/？/g, "　　").split("_");
			if (c_name[1] === undefined) {
				c_name[1] = "";
			}
			l_texts += "<text style=\"font-size: " + c_settings["font_size"] + "px;\" x=\"" + c_x + "\" y=\"" + (c_y + c_settings["font_size"] / 4) + "\">" + c_name[0] + " " + c_name[1] + "</text>";
			if (c_settings["show_other_parent"] === true) {
				//仮の親子線
				if (c_father_id !== null) {
					l_parent_line += "<path style=\"stroke: " + l_father_line_color + ";\" d=\"M " + c_father_x_2 + ", " +c_father_y_2 + " L " + c_group_x +  ", " + c_father_y_2 + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
				}
				if (c_mother_id !== null) {
					l_parent_line += "<path style=\"stroke: " + l_mother_line_color + ";\" d=\"M " + c_mother_x_2 + ", " +c_mother_y_2 + " L " + c_group_x +  ", " + c_mother_y_2 + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
				}
			}
		} else if (c_type === "adoption") { //養子線
			if (c_father_id !== null) {
				l_adoption_line += "<path style=\"stroke: " + l_father_line_color + "; stroke-dasharray: 4px;\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
			}
			if (c_mother_id !== null) {
				l_adoption_line += "<path style=\"stroke: " + l_mother_line_color + "; stroke-dasharray: 4px;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
			}
		}
	}
	l_paths += l_marriage_line + l_parent_line + l_adoption_line;
	
	
	
	console.log(c_persons);
	console.log(c_marriages);
	document.getElementById(a_div_id).innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" baseProfile=\"full\" viewBox=\"0 0 " + c_settings["svg_width"] + " " + c_settings["svg_height"] + "\" width=\"" + c_settings["svg_width"] + "\" height=\"" + c_settings["svg_height"] + "\">" + "<g style=\"font-size: 16px; line-height: 1; font-family: IPAmjMincho;\">" + l_texts + "</g>" + "<g style=\"fill: none; stroke: #000000; stroke-width: " + c_settings["line_width"] + ";\">" + l_paths + "</g>" + "</svg>";
	document.getElementById(a_div_id).innerHTML += "<div><a id=\"output_svg\" href=\"#\" download=\"familytree.svg\" onclick=\"f_output_svg('" + a_div_id +"')\">SVG保存</a></div>";
}


function f_output_svg(a_div_id) {
	const c_svg = document.getElementById(a_div_id).firstElementChild.outerHTML;
	const c_blob = new Blob([c_svg], {"type": "image/svg+xml"});
	if (window.navigator.msSaveBlob) { 
		window.navigator.msSaveBlob(c_blob, "familytree.svg"); 
	} else {
		document.getElementById("output_svg").href = window.URL.createObjectURL(c_blob);
	}
}

