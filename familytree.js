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

async function f_familytree(a_url, a_div_id) {
	//設定
	const c_settings = {
		"one_per_row": true, //1行あたり1人のみ表示の場合true
		"show_other_parent": true, //headでない親を簡易表示、one_per_rowがtrueの場合に有効
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
	
	//読み込み
	const c_data = JSON.parse((await f_xhr_get(a_url, "text")).responseText);
	//データの整理
	//undefinedをnullにそろえる
	for (let i1 = 0; i1 < c_data.length; i1++) {
		//typeをそろえる
		if (c_data[i1]["type"] === undefined || c_data[i1]["type"] === null) {
			c_data[i1]["type"] = "person";
		} else if (c_data[i1]["type"] !== "person" && c_data[i1]["type"] !== "marriage" && c_data[i1]["type"] !== "adoption") {
			c_data[i1]["type"] = "person";
		}
		//husband_idはfather_idに、wife_idはmother_idに統合する
		//headのみ入力しておき、head_idとother_idは自動入力する
		//headをfather_idかmother_idにそろえる
		if (c_data[i1]["head"] === "husband_id") {
			c_data[i1]["head"] = "father_id";
		} else if (c_data[i1]["head"] === "wife_id") {
			c_data[i1]["head"] = "mother_id";
		} else if (c_data[i1]["head"] === undefined || c_data[i1]["head"] === null) {
			c_data[i1]["head"] = c_settings["head_id"];
		} else if (c_data[i1]["head"] !== "father_id" && c_data[i1]["head"] !== "mother_id") {
			c_data[i1]["head"] = c_settings["head_id"];
		}
		//father_id、mother_id、husband_id、wife_idをそろえる
		if (c_data[i1]["father_id"] === undefined) {
			c_data[i1]["father_id"] = null;
		}
		if (c_data[i1]["mother_id"] === undefined) {
			c_data[i1]["mother_id"] = null;
		}
		if (c_data[i1]["husband_id"] === undefined) {
			c_data[i1]["husband_id"] = null;
		}
		if (c_data[i1]["wife_id"] === undefined) {
			c_data[i1]["wife_id"] = null;
		}
		if (c_data[i1]["father_id"] === null) {
			c_data[i1]["father_id"] = c_data[i1]["husband_id"];
		}
		if (c_data[i1]["mother_id"] === null) {
			c_data[i1]["mother_id"] = c_data[i1]["wife_id"];
		}
		//head_idとother_idを設定する
		if (c_data[i1]["head"] === "father_id") {
			c_data[i1]["head_id"] = c_data[i1]["father_id"];
			c_data[i1]["other_id"] = c_data[i1]["mother_id"];
			if (c_data[i1]["head_id"] === null) {
				c_data[i1]["head_id"] = c_data[i1]["mother_id"];
				c_data[i1]["other_id"] = c_data[i1]["father_id"];
			}
		} else if (c_data[i1]["head"] === "mother_id") {
			c_data[i1]["head_id"] = c_data[i1]["mother_id"];
			c_data[i1]["other_id"] = c_data[i1]["father_id"];
			if (c_data[i1]["head_id"] === null) {
				c_data[i1]["head_id"] = c_data[i1]["father_id"];
				c_data[i1]["other_id"] = c_data[i1]["mother_id"];
			}
		}
	}
	
	//分類
	const c_persons = [];
	const c_marriages = [];
	const c_adoptions = [];
	for (let i1 = 0; i1 < c_data.length; i1++) {
		if (c_data[i1]["type"] === "person") {
			c_persons.push(c_data[i1]);
		} else if (c_data[i1]["type"] === "marriage" && c_data[i1]["father_id"] !== null && c_data[i1]["mother_id"] !== null) { //夫婦のどちらかが欠けるものは除く
			c_marriages.push(c_data[i1]);
		} else if (c_data[i1]["type"] === "adoption") {
			c_adoptions.push(c_data[i1]);
		}
	}
	
	//インデックスを作る
	const c_person_index = {};
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_person_index[c_persons[i1]["id"]] = c_persons[i1];
	}
	//先に見つからないidのpersonをすべて加えておく
	for (let i1 = 0; i1 < c_data.length; i1++) {
		const c_father_id = c_data[i1]["father_id"];
		const c_mother_id = c_data[i1]["mother_id"];
		if (c_father_id !== null) { //探す場合
			if (c_person_index[c_father_id] === undefined) { //見つからない場合、加える
				c_data.push({"type": "person", "id": c_father_id, "father_id": null, "mother_id": null, "head_id": null, "other_id": null});
				c_persons.push(c_data[c_data.length - 1]);
				c_person_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_person_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_data.push({"type": "person", "id": c_mother_id, "father_id": null, "mother_id": null, "head_id": null, "other_id": null});
				c_persons.push(c_data[c_data.length - 1]);
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
	for (let i1 = 0; i1 < c_data.length; i1++) {
		const c_type = c_data[i1]["type"];
		const c_id = c_data[i1]["id"];
		const c_father_id = c_data[i1]["father_id"];
		const c_mother_id = c_data[i1]["mother_id"];
		const c_head_id = c_data[i1]["head_id"];
		const c_other_id = c_data[i1]["other_id"];
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
			console.log(c_data[i1]);
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
	
	//線
	for (let i1 = 0; i1 < c_data.length; i1++) {
		const c_type = c_data[i1]["type"];
		const c_father_id = c_data[i1]["father_id"];
		const c_mother_id = c_data[i1]["mother_id"];
		const c_head_id = c_data[i1]["head_id"];
		const c_other_id = c_data[i1]["other_id"];
		//head_personと欠けた婚姻は除く
		if (c_type === "person" && c_head_id === null) { //一番はじめ
			//名
			const c_name = c_data[i1]["id"].split("_");
			if (c_name[1] === undefined) {
				c_name[1] = "";
			}
			l_texts += "<text style=\"font-size: " + c_settings["font_size"] + "px;\" x=\"" +c_data[i1]["x"] + "\" y=\"" + c_data[i1]["y"] + "\">" + c_name[0] + " " + c_name[1] + "</text>";
			continue;
		}
		if (c_type === "marriage" && (c_father_id === null || c_mother_id === null)) { //片方ない婚姻
			continue;
		}
		const c_group_id = f_group_id(c_father_id, c_mother_id, c_head_id, c_other_id);
		const c_group = c_group_index[c_group_id];
		//generationの計算
		if (c_type === "marriage" || c_type === "adoption") {
			c_data[i1]["generation"] = c_group["generation"];
		}
		const c_generation = c_data[i1]["generation"] - 1;
		const c_group_line_order = c_group["group_line_order"];
		const c_group_x = c_generation * c_settings["length"] * c_settings["font_size"] + c_settings["text_length"] * c_settings["font_size"] + c_settings["left_offset"] + c_group_line_order * c_settings["line_space"];
		//xyの計算
		if (c_type === "adoption") {
			const c_id = c_data[i1]["id"];
			c_data[i1]["x"] = c_person_index[c_id]["x"];
			c_data[i1]["y"] = c_person_index[c_id]["y"];
		}
		const c_x = c_data[i1]["x"]; //undefinedかもしれない
		const c_y = c_data[i1]["y"]; //undefinedかもしれない
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
			l_marriage_line += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_mother_y + "\" />";
			l_marriage_line += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_father_y + "\" />";
			if (c_settings["show_other_parent"] === true) {
				//仮の名
				const c_name = c_other_id.split("_");
				if (c_name[1] === undefined) {
					c_name[1] = "";
				}
				l_texts += "<text style=\"font-size: " + c_settings["font_size"] + "px;\" x=\"" + c_group["x"] + "\" y=\"" + c_group["y"] + "\"><tspan style=\"fill: #808080;\">" + c_name[0] + "</tspan> " + c_name[1] + "</text>";
				//仮の婚姻線
				l_marriage_line += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x_2 +  ", " + c_father_y_2 + " L " + c_group_x +  ", " + c_father_y_2 + " L " + c_group_x +  ", " + c_mother_y_2 + "\" />";
				l_marriage_line += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x_2 + ", " +c_mother_y_2 + " L " + c_group_x +  ", " + c_mother_y_2 + " L " + c_group_x +  ", " + c_father_y_2 + "\" />";
			}
		} else if (c_type === "person") { //親子線と名
			//一番最初の人
			const c_person_id = c_group["child_ids"][0];
			const c_group_y = c_person_index[c_person_id]["y"] + l_sibling_line_up;
			//兄弟姉妹の線のx
			const c_sibling_x = c_x - c_settings["right_offset"];
			if (c_father_id !== null) {
				l_parent_line += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
			}
			if (c_mother_id !== null) {
				l_parent_line += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
			}
			//名
			const c_name = c_data[i1]["id"].split("_");
			if (c_name[1] === undefined) {
				c_name[1] = "";
			}
			l_texts += "<text style=\"font-size: " + c_settings["font_size"] + "px;\" x=\"" + c_x + "\" y=\"" + c_y + "\">" + c_name[0] + " " + c_name[1] + "</text>";
			if (c_settings["show_other_parent"] === true) {
				//仮の親子線
				if (c_father_id !== null) {
					l_parent_line += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x_2 + ", " +c_father_y_2 + " L " + c_group_x +  ", " + c_father_y_2 + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
				}
				if (c_mother_id !== null) {
					l_parent_line += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x_2 + ", " +c_mother_y_2 + " L " + c_group_x +  ", " + c_mother_y_2 + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
				}
			}
		} else if (c_type === "adoption") { //養子線
			if (c_father_id !== null) {
				l_adoption_line += "<path style=\"stroke: #0000FF; stroke-dasharray: 4px;\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
			}
			if (c_mother_id !== null) {
				l_adoption_line += "<path style=\"stroke: #FF0000; stroke-dasharray: 4px;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
			}
		}
	}
	l_paths += l_marriage_line + l_parent_line + l_adoption_line;
	
	
	
	console.log(c_persons);
	console.log(c_marriages);
	document.getElementById(a_div_id).innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" baseProfile=\"full\" viewBox=\"0 0 1024 2048\" width=\"1024\" height=\"2048\">" + "<g style=\"font-size: 16px; line-height: 1; font-family: IPAmjMincho;\">" + l_texts + "</g>" + "<g style=\"fill: none; stroke: #000000; stroke-width: " + c_settings["line_width"] + ";\">" + l_paths + "</g>" + "</svg>";
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

