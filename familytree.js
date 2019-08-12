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
		"standard_parent": "father" //表示は父系基準とする
	};
	
	//読み込み
	const c_data = JSON.parse((await f_xhr_get(a_url, "text")).responseText);
	//分類
	const c_persons = [];
	const c_marriages = [];
	const c_adoptions = [];
	for (let i1 = 0; i1 < c_data.length; i1++) {
		if (c_data[i1]["type"] === undefined || c_data[i1]["type"] === "person") {
			c_persons.push(c_data[i1]);
		} else if (c_data[i1]["type"] === "marriage") {
			c_marriages.push(c_data[i1]);
		} else if (c_data[i1]["type"] === "adoption") {
			c_adoptions.push(c_data[i1]);
		}
	}
	
	//undefinedをnullにそろえる
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		if (c_persons[i1]["father_id"] === undefined) {
			c_persons[i1]["father_id"] = null;
		}
		if (c_persons[i1]["mother_id"] === undefined) {
			c_persons[i1]["mother_id"] = null;
		}
	}
	for (let i1 = 0; i1 < c_marriages.length; i1++) {
		if (c_marriages[i1]["husband_id"] === undefined) {
			c_marriages[i1]["husband_id"] = null;
		}
		if (c_marriages[i1]["wife_id"] === undefined) {
			c_marriages[i1]["wife_id"] = null;
		}
	}
	for (let i1 = 0; i1 < c_adoptions.length; i1++) {
		if (c_adoptions[i1]["father_id"] === undefined) {
			c_adoptions[i1]["father_id"] = null;
		}
		if (c_adoptions[i1]["mother_id"] === undefined) {
			c_adoptions[i1]["mother_id"] = null;
		}
	}
	
	//インデックスを作る
	const c_person_index = {};
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_person_index[c_persons[i1]["id"]] = c_persons[i1];
	}
	//先に見つからないidをすべて加えておく
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_father_id = c_persons[i1]["father_id"];
		const c_mother_id = c_persons[i1]["mother_id"];
		if (c_father_id !== null) { //探す場合
			if (c_person_index[c_father_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_father_id, "father_id": null, "mother_id": null});
				c_person_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_person_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_mother_id, "father_id": null, "mother_id": null});
				c_person_index[c_mother_id] = c_persons[c_persons.length - 1];
			}
		}
	}
	for (let i1 = 0; i1 < c_marriages.length; i1++) {
		const c_father_id = c_marriages[i1]["husband_id"];
		const c_mother_id = c_marriages[i1]["wife_id"];
		if (c_father_id !== null) { //探す場合
			if (c_person_index[c_father_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_father_id, "father_id": null, "mother_id": null});
				c_person_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_person_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_mother_id, "father_id": null, "mother_id": null});
				c_person_index[c_mother_id] = c_persons[c_persons.length - 1];
			}
		}
	}
	for (let i1 = 0; i1 < c_adoptions.length; i1++) {
		const c_father_id = c_adoptions[i1]["father_id"];
		const c_mother_id = c_adoptions[i1]["mother_id"];
		if (c_father_id !== null) { //探す場合
			if (c_person_index[c_father_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_father_id, "father_id": null, "mother_id": null});
				c_person_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_person_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_mother_id, "father_id": null, "mother_id": null});
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
	const c_top_persons = [];
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_id = c_persons[i1]["id"];
		const c_father_id = c_persons[i1]["father_id"];
		const c_mother_id = c_persons[i1]["mother_id"];
		if (c_father_id === null && c_mother_id === null) { //一番はじめ
			c_top_persons.push(c_id);
			continue;
		}
		const c_group_id = "group_" + c_father_id + "_" + c_mother_id;
		let l_group = c_group_index[c_group_id];
		if (l_group === undefined) { //ない場合、加える
			let l_parent_id = null;
			if (c_settings["standard_parent"] === "father") {
				l_parent_id = c_father_id;
			} else if (c_settings["standard_parent"] === "mother") {
				l_parent_id = c_mother_id;
			}
			if (l_parent_id === null) {
				l_parent_id = c_mother_id;
			}
			const c_groups = c_person_index[l_parent_id]["groups"];
			c_groups.push({"father_id": c_father_id, "mother_id": c_mother_id, "child_ids": [], "width": null, "marriage": null});
			c_group_index[c_group_id] = c_groups[c_groups.length - 1];
			l_group = c_group_index[c_group_id];
		}
		l_group["child_ids"].push(c_id);
	}
	//婚姻用
	for (let i1 = 0; i1 < c_marriages.length; i1++) {
		const c_father_id = c_marriages[i1]["husband_id"];
		const c_mother_id = c_marriages[i1]["wife_id"];
		if (c_father_id === null || c_mother_id === null) { //片方ない
			continue;
		}
		const c_group_id = "group_" + c_father_id + "_" + c_mother_id;
		let l_group = c_group_index[c_group_id];
		if (l_group === undefined) { //ない場合、加える
			let l_parent_id = null;
			if (c_settings["standard_parent"] === "father") {
				l_parent_id = c_father_id;
			} else if (c_settings["standard_parent"] === "mother") {
				l_parent_id = c_mother_id;
			}
			if (l_parent_id === null) {
				l_parent_id = c_mother_id;
			}
			const c_groups = c_person_index[l_parent_id]["groups"];
			c_groups.push({"father_id": c_father_id, "mother_id": c_mother_id, "child_ids": [], "width": null, "marriage": null});
			c_group_index[c_group_id] = c_groups[c_groups.length - 1];
			l_group = c_group_index[c_group_id];
		}
		l_group["marriage"] = true;
	}
	//養子用
	for (let i1 = 0; i1 < c_adoptions.length; i1++) {
		const c_father_id = c_adoptions[i1]["father_id"];
		const c_mother_id = c_adoptions[i1]["mother_id"];
		const c_group_id = "group_" + c_father_id + "_" + c_mother_id;
		let l_group = c_group_index[c_group_id];
		if (l_group === undefined) { //ない場合、加える
			let l_parent_id = null;
			if (c_settings["standard_parent"] === "father") {
				l_parent_id = c_father_id;
			} else if (c_settings["standard_parent"] === "mother") {
				l_parent_id = c_mother_id;
			}
			if (l_parent_id === null) {
				l_parent_id = c_mother_id;
			}
			const c_groups = c_person_index[l_parent_id]["groups"];
			c_groups.push({"father_id": c_father_id, "mother_id": c_mother_id, "child_ids": [], "width": null, "marriage": null});
			c_group_index[c_group_id] = c_groups[c_groups.length - 1];
			l_group = c_group_index[c_group_id];
		}
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
				c_groups[i2]["width"] = l_group_width;
			}
			//familyのwidth
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
				l_width += 1;
			}
			c_persons[i1]["width"] = l_width;
		}
	}
	
	//順序
	let l_order = 0;
	for (let i1 = 0; i1 < c_top_persons.length; i1++) {
		c_person_index[c_top_persons[i1]]["order"] = l_order;
		f_order(c_top_persons[i1]);
		l_order += c_person_index[c_top_persons[i1]]["width"];
	}
	function f_order(a_id) {
		let l_group_order = c_person_index[a_id]["order"];
		const c_groups = c_person_index[a_id]["groups"];
		for (let i1 = 0; i1 < c_groups.length; i1++) {
			c_groups[i1]["order"] = l_group_order;
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
	for (let i1 = 0; i1 < c_top_persons.length; i1++) {
		c_person_index[c_top_persons[i1]]["generation"] = 0; //最初
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
	
	//位置の計算
	c_settings["font_size"] = 16; //フォントサイズ
	c_settings["line_height"] = 1.25; //文字の縦の間隔
	c_settings["line_width"] = 1; //線の幅
	c_settings["line_space"] = 3; //線の間隔
	c_settings["left_offset"] = 8; //左の字と線の間隔
	c_settings["right_offset"] = 8; //右の字と線の間隔
	c_settings["text_length"] = 8; //想定する最大文字数
	c_settings["length"] = 12; //横の間隔（文字数で表記）
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_persons[i1]["x"] = c_persons[i1]["generation"] * c_settings["length"] * c_settings["font_size"] + c_settings["font_size"];
		c_persons[i1]["y"] = c_persons[i1]["order"] * c_settings["line_height"] * c_settings["font_size"] + c_settings["font_size"];
	}
	//テキスト
	let l_texts = "";
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_name = c_persons[i1]["id"].split("_");
		if (c_name[1] === undefined) {
			c_name[1] = "";
		}
		l_texts += "<text style=\"font-size: " + c_settings["font_size"] + "px;\" x=\"" + c_persons[i1]["x"] + "\" y=\"" + c_persons[i1]["y"] + "\">" + c_name[0] + " " + c_name[1] + "</text>";
	}
	let l_paths = "";
	//婚姻のみ線
	for (let i1 = 0; i1 < c_marriages.length; i1++) {
		const c_father_id = c_marriages[i1]["husband_id"];
		const c_mother_id = c_marriages[i1]["wife_id"];
		if (c_father_id === null && c_mother_id === null) {
			continue;
		}
		const c_group_id = "group_" + c_father_id + "_" + c_mother_id;
		const c_group = c_group_index[c_group_id];
		if (c_group === undefined) {
			continue;
		}
		const c_generation = c_group["generation"] - 1;
		const c_group_line_order = c_group["group_line_order"];
		const c_group_x = c_generation * c_settings["length"] * c_settings["font_size"] + c_settings["text_length"] * c_settings["font_size"] + c_settings["left_offset"] + c_group_line_order * c_settings["line_space"];
		//
		const c_father = c_person_index[c_father_id];
		const c_father_x = c_father["x"] + c_settings["text_length"] * c_settings["font_size"];
		const c_father_y = c_father["y"];
		const c_mother = c_person_index[c_mother_id];
		const c_mother_x = c_mother["x"] + c_settings["text_length"] * c_settings["font_size"];
		const c_mother_y = c_mother["y"];
		l_paths += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_mother_y + "\" />";
		l_paths += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_father_y + "\" />";
	}
	//親子線
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_x = c_persons[i1]["x"];
		const c_y = c_persons[i1]["y"];
		const c_generation = c_persons[i1]["generation"] - 1;
		const c_father_id = c_persons[i1]["father_id"];
		const c_mother_id = c_persons[i1]["mother_id"];
		const c_group_id = "group_" + c_father_id + "_" + c_mother_id;
		const c_group = c_group_index[c_group_id];
		if (c_group === undefined) {
			continue;
		}
		const c_group_line_order = c_group["group_line_order"];
		const c_group_x = c_generation * c_settings["length"] * c_settings["font_size"] + c_settings["text_length"] * c_settings["font_size"] + c_settings["left_offset"] + c_group_line_order * c_settings["line_space"];
		//一番最初の人
		const c_person_id = c_group["child_ids"][0];
		const c_group_y = c_person_index[c_person_id]["y"] + c_settings["font_size"] * c_settings["line_height"] / 2;
		//兄弟姉妹の線のx
		const c_sibling_x = c_x - c_settings["right_offset"];
		if (c_father_id !== null) {
			const c_father = c_person_index[c_father_id];
			const c_father_x = c_father["x"] + c_settings["text_length"] * c_settings["font_size"];
			const c_father_y = c_father["y"];
			l_paths += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
		}
		if (c_mother_id !== null) {
			const c_mother = c_person_index[c_mother_id];
			const c_mother_x = c_mother["x"] + c_settings["text_length"] * c_settings["font_size"];
			const c_mother_y = c_mother["y"];
			l_paths += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_group_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";

		}
	}
	//養子線
	for (let i1 = 0; i1 < c_adoptions.length; i1++) {
		const c_x = c_person_index[c_adoptions[i1]["id"]]["x"];
		const c_y = c_person_index[c_adoptions[i1]["id"]]["y"];
		const c_father_id = c_adoptions[i1]["father_id"];
		const c_mother_id = c_adoptions[i1]["mother_id"];
		const c_group_id = "group_" + c_father_id + "_" + c_mother_id;
		const c_group = c_group_index[c_group_id];
		if (c_group === undefined) {
			continue;
		}
		const c_generation = c_group["generation"] - 1;
		const c_group_line_order = c_group["group_line_order"];
		const c_group_x = c_generation * c_settings["length"] * c_settings["font_size"] + c_settings["text_length"] * c_settings["font_size"] + c_settings["left_offset"] + c_group_line_order * c_settings["line_space"];
		if (c_father_id !== null) {
			const c_father = c_person_index[c_father_id];
			const c_father_x = c_father["x"] + c_settings["text_length"] * c_settings["font_size"];
			const c_father_y = c_father["y"];
			l_paths += "<path style=\"stroke: #0000FF; stroke-dasharray: 4px;\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_group_x +  ", " + c_father_y + " L " + c_group_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
		}
		if (c_mother_id !== null) {
			const c_mother = c_person_index[c_mother_id];
			const c_mother_x = c_mother["x"] + c_settings["text_length"] * c_settings["font_size"];
			const c_mother_y = c_mother["y"];
			l_paths += "<path style=\"stroke: #FF0000; stroke-dasharray: 4px;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_group_x +  ", " + c_mother_y + " L " + c_group_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";

		}
	}
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

