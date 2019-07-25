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
	const c_data = JSON.parse((await f_xhr_get(a_url, "text")).responseText);
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
	//まずは最小限の構成とする
	//入力はid, father_id, mother_idのみ
	
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
	const c_index = {};
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_index[c_persons[i1]["id"]] = c_persons[i1];
	}
	//先に見つからないidをすべて加えておく
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_father_id = c_persons[i1]["father_id"];
		const c_mother_id = c_persons[i1]["mother_id"];
		if (c_father_id !== null) { //探す場合
			if (c_index[c_father_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_father_id, "father_id": null, "mother_id": null});
				c_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_mother_id, "father_id": null, "mother_id": null});
				c_index[c_mother_id] = c_persons[c_persons.length - 1];
			}
		}
	}
	for (let i1 = 0; i1 < c_marriages.length; i1++) {
		const c_father_id = c_marriages[i1]["husband_id"];
		const c_mother_id = c_marriages[i1]["wife_id"];
		if (c_father_id !== null) { //探す場合
			if (c_index[c_father_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_father_id, "father_id": null, "mother_id": null});
				c_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_mother_id, "father_id": null, "mother_id": null});
				c_index[c_mother_id] = c_persons[c_persons.length - 1];
			}
		}
	}
	for (let i1 = 0; i1 < c_adoptions.length; i1++) {
		const c_father_id = c_adoptions[i1]["father_id"];
		const c_mother_id = c_adoptions[i1]["mother_id"];
		if (c_father_id !== null) { //探す場合
			if (c_index[c_father_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_father_id, "father_id": null, "mother_id": null});
				c_index[c_father_id] = c_persons[c_persons.length - 1];
			}
		}
		if (c_mother_id !== null) { //探す場合
			if (c_index[c_mother_id] === undefined) { //見つからない場合、加える
				c_persons.push({"id": c_mother_id, "father_id": null, "mother_id": null});
				c_index[c_mother_id] = c_persons[c_persons.length - 1];
			}
		}
	}
	//familiesを作る
	//familyはfatherとmotherの組により定まる
	//構造は人-family-人
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_persons[i1]["families"] = [];
		c_persons[i1]["width"] = null;
	}
	const c_family_index = {};
	const c_tops = [];
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_id = c_persons[i1]["id"];
		const c_father_id = c_persons[i1]["father_id"];
		const c_mother_id = c_persons[i1]["mother_id"];
		if (c_father_id === null && c_mother_id === null) { //一番はじめ
			c_tops.push(c_id);
			continue;
		}
		const c_family_id = "family_" + c_father_id + "_" + c_mother_id;
		let l_family = c_family_index[c_family_id];
		if (l_family === undefined) { //ない場合、加える
			let l_parent_id = c_father_id; //仮に父系
			if (l_parent_id === null) {
				l_parent_id = c_mother_id;
			}
			const c_families = c_index[l_parent_id]["families"];
			c_families.push({"father_id": c_father_id, "mother_id": c_mother_id, "child_ids": [], "width": null, "marriage": null});
			c_family_index[c_family_id] = c_families[c_families.length - 1];
			l_family = c_family_index[c_family_id];
		}
		l_family["child_ids"].push(c_id);
	}
	//婚姻用
	for (let i1 = 0; i1 < c_marriages.length; i1++) {
		const c_father_id = c_marriages[i1]["husband_id"];
		const c_mother_id = c_marriages[i1]["wife_id"];
		if (c_father_id === null || c_mother_id === null) { //片方ない
			continue;
		}
		const c_family_id = "family_" + c_father_id + "_" + c_mother_id;
		let l_family = c_family_index[c_family_id];
		if (l_family === undefined) { //ない場合、加える
			let l_parent_id = c_father_id; //仮に父系
			if (l_parent_id === null) {
				l_parent_id = c_mother_id;
			}
			const c_families = c_index[l_parent_id]["families"];
			c_families.push({"father_id": c_father_id, "mother_id": c_mother_id, "child_ids": [], "width": null, "marriage": null});
			c_family_index[c_family_id] = c_families[c_families.length - 1];
			l_family = c_family_index[c_family_id];
		}
		l_family["marriage"] = true;
	}
	//養子用
	for (let i1 = 0; i1 < c_adoptions.length; i1++) {
		const c_father_id = c_adoptions[i1]["father_id"];
		const c_mother_id = c_adoptions[i1]["mother_id"];
		const c_family_id = "family_" + c_father_id + "_" + c_mother_id;
		let l_family = c_family_index[c_family_id];
		if (l_family === undefined) { //ない場合、加える
			let l_parent_id = c_father_id; //仮に父系
			if (l_parent_id === null) {
				l_parent_id = c_mother_id;
			}
			const c_families = c_index[l_parent_id]["families"];
			c_families.push({"father_id": c_father_id, "mother_id": c_mother_id, "child_ids": [], "width": null, "marriage": null});
			c_family_index[c_family_id] = c_families[c_families.length - 1];
			l_family = c_family_index[c_family_id];
		}
	}
	//幅を数える
	let l_exist = true; //抜けがあるときtrue
	while (l_exist === true) {
		l_exist = false;
		for (let i1 = 0; i1 < c_persons.length; i1++) {
			const c_families = c_persons[i1]["families"];
			//childのwidth
			for (let i2 = 0; i2 < c_families.length; i2++) {
				let l_family_width = 0;
				for (let i3 = 0; i3 < c_families[i2]["child_ids"].length; i3++) {
					const c_id = c_families[i2]["child_ids"][i3];
					const c_child_width = c_index[c_id]["width"];
					if (c_child_width === null) {
						l_family_width = null;
						l_exist = true;
						break;
					}
					l_family_width += c_child_width;
				}
				c_families[i2]["width"] = l_family_width;
			}
			//familyのwidth
			let l_width = 0;
			for (let i2 = 0; i2 < c_families.length; i2++) {
				const c_family_width = c_families[i2]["width"];
				if (c_family_width === null) {
					l_width = null;
					l_exist = true;
					break;
				}
				l_width += c_family_width;
			}
			if (l_width === 0) {
				l_width = 1; //0人でも親の分を確保する
			}
			c_persons[i1]["width"] = l_width;
		}
	}
	//順序
	let l_order = 0;
	for (let i1 = 0; i1 < c_tops.length; i1++) {
		c_index[c_tops[i1]]["order"] = l_order;
		f_order(c_tops[i1]);
		l_order += c_index[c_tops[i1]]["width"];
	}
	function f_order(a_id) {
		let l_family_order = c_index[a_id]["order"];
		const c_families = c_index[a_id]["families"];
		for (let i1 = 0; i1 < c_families.length; i1++) {
			c_families[i1]["order"] = l_family_order;
			let l_child_order = l_family_order;
			for (let i2 = 0; i2 < c_families[i1]["child_ids"].length; i2++) {
				const c_id = c_families[i1]["child_ids"][i2];
				c_index[c_id]["order"] = l_child_order;
				f_order(c_id);
				l_child_order += c_index[c_id]["width"];
			}
			l_family_order += c_families[i1]["width"];
		}
	}
	//世代
	let l_generation = 0;
	for (let i1 = 0; i1 < c_tops.length; i1++) {
		c_index[c_tops[i1]]["generation"] = l_generation;
		f_generation(c_tops[i1]);
	}
	function f_generation(a_id) {
		let l_child_generation = c_index[a_id]["generation"] + 1;
		const c_families = c_index[a_id]["families"];
		for (let i1 = 0; i1 < c_families.length; i1++) {
			c_families[i1]["generation"] = l_child_generation;
			for (let i2 = 0; i2 < c_families[i1]["child_ids"].length; i2++) {
				const c_id = c_families[i1]["child_ids"][i2];
				c_index[c_id]["generation"] = l_child_generation;
				f_generation(c_id);
			}
		}
	}
	//familyの線の順序（family_order）
	let l_family_order = 0;
	let l_generation_2 = 0;
	let l_exist_2 = true; //その世代が存在
	while (l_exist_2 === true) {
		l_exist_2 = false;
		for (let i1 = 0; i1 < c_persons.length; i1++) {
			if (c_persons[i1]["generation"] === l_generation_2) {
				l_exist_2 = true;
				const c_families = c_persons[i1]["families"];
				for (let i2 = 0; i2 < c_families.length; i2++) {
					c_families[i2]["family_order"] = l_family_order;
					l_family_order += 1;
				}
			}
		}
		l_generation_2 += 1;
		l_family_order = 0;
	}
	//位置の計算
	const c_font_size_1 = 16;
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		c_persons[i1]["x"] = c_persons[i1]["generation"] * 16 * c_font_size_1;
		c_persons[i1]["y"] = c_persons[i1]["order"] * 2 * c_font_size_1 + 32;
	}
	//テキスト
	let l_texts = "";
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_name = c_persons[i1]["id"].split("_");
		if (c_name[1] === undefined) {
			c_name[1] = "";
		}
		l_texts += "<text style=\"font-size: " + c_font_size_1 + "px;\" x=\"" + c_persons[i1]["x"] + "\" y=\"" + c_persons[i1]["y"] + "\">" + c_name[0] + " " + c_name[1] + "</text>";
	}
	//婚姻のみ線
	for (let i1 = 0; i1 < c_marriages.length; i1++) {
		const c_father_id = c_marriages[i1]["husband_id"];
		const c_mother_id = c_marriages[i1]["wife_id"];
		if (c_father_id === null && c_mother_id === null) {
			continue;
		}
		const c_family_id = "family_" + c_father_id + "_" + c_mother_id;
		const c_family = c_family_index[c_family_id];
		if (c_family === undefined) {
			continue;
		}
		const c_generation = c_family["generation"] - 1;
		const c_family_order = c_family["family_order"];
		const c_family_x = c_generation * 16 * c_font_size_1 + 9 * c_font_size_1 + c_family_order * 4;
		//
		const c_father = c_index[c_father_id];
		const c_father_x = c_father["x"] + 8 * c_font_size_1;
		const c_father_y = c_father["y"];
		const c_mother = c_index[c_mother_id];
		const c_mother_x = c_mother["x"] + 8 * c_font_size_1;
		const c_mother_y = c_mother["y"];
		l_paths += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x +  ", " + c_father_y + " L " + c_family_x +  ", " + c_father_y + " L " + c_family_x +  ", " + c_mother_y + "\" />";
		l_paths += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_family_x +  ", " + c_mother_y + " L " + c_family_x +  ", " + c_father_y + "\" />";
	}
	//親子線
	let l_paths = "";
	for (let i1 = 0; i1 < c_persons.length; i1++) {
		const c_x = c_persons[i1]["x"];
		const c_y = c_persons[i1]["y"];
		const c_generation = c_persons[i1]["generation"] - 1;
		const c_father_id = c_persons[i1]["father_id"];
		const c_mother_id = c_persons[i1]["mother_id"];
		const c_family_id = "family_" + c_father_id + "_" + c_mother_id;
		const c_family = c_family_index[c_family_id];
		if (c_family === undefined) {
			continue;
		}
		const c_family_order = c_family["family_order"];
		const c_family_x = c_generation * 16 * c_font_size_1 + 9 * c_font_size_1 + c_family_order * 4;
		//一番最初の人
		const c_person_id = c_family["child_ids"][0];
		const c_family_y = c_index[c_person_id]["y"] + c_font_size_1;
		//兄弟姉妹の線のx
		const c_sibling_x = c_x - c_font_size_1;
		if (c_father_id !== null) {
			const c_father = c_index[c_father_id];
			const c_father_x = c_father["x"] + 8 * c_font_size_1;
			const c_father_y = c_father["y"];
			l_paths += "<path style=\"stroke: #0000FF;\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_family_x +  ", " + c_father_y + " L " + c_family_x +  ", " + c_family_y + " L " + c_sibling_x +  ", " + c_family_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
		}
		if (c_mother_id !== null) {
			const c_mother = c_index[c_mother_id];
			const c_mother_x = c_mother["x"] + 8 * c_font_size_1;
			const c_mother_y = c_mother["y"];
			l_paths += "<path style=\"stroke: #FF0000;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_family_x +  ", " + c_mother_y + " L " + c_family_x +  ", " + c_family_y + " L " + c_sibling_x +  ", " + c_family_y + " L " + c_sibling_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";

		}
	}
	//養子線
	for (let i1 = 0; i1 < c_adoptions.length; i1++) {
		const c_x = c_index[c_adoptions[i1]["id"]]["x"];
		const c_y = c_index[c_adoptions[i1]["id"]]["y"];
		const c_father_id = c_adoptions[i1]["father_id"];
		const c_mother_id = c_adoptions[i1]["mother_id"];
		const c_family_id = "family_" + c_father_id + "_" + c_mother_id;
		const c_family = c_family_index[c_family_id];
		if (c_family === undefined) {
			continue;
		}
		const c_generation = c_family["generation"] - 1;
		const c_family_order = c_family["family_order"];
		const c_family_x = c_generation * 16 * c_font_size_1 + 9 * c_font_size_1 + c_family_order * 4;
		if (c_father_id !== null) {
			const c_father = c_index[c_father_id];
			const c_father_x = c_father["x"] + 8 * c_font_size_1;
			const c_father_y = c_father["y"];
			l_paths += "<path style=\"stroke: #0000FF; stroke-dasharray: 4px;\" d=\"M " + c_father_x + ", " +c_father_y + " L " + c_family_x +  ", " + c_father_y + " L " + c_family_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";
		}
		if (c_mother_id !== null) {
			const c_mother = c_index[c_mother_id];
			const c_mother_x = c_mother["x"] + 8 * c_font_size_1;
			const c_mother_y = c_mother["y"];
			l_paths += "<path style=\"stroke: #FF0000; stroke-dasharray: 4px;\" d=\"M " + c_mother_x + ", " +c_mother_y + " L " + c_family_x +  ", " + c_mother_y + " L " + c_family_x +  ", " + c_y + " L " + c_x +  ", " + c_y + "\" />";

		}
	}
	console.log(c_persons);
	console.log(c_marriages);
	document.getElementById(a_div_id).innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" baseProfile=\"full\" viewBox=\"0 0 1536 2048\" width=\"1536\" height=\"2048\">" + "<g style=\"font-size: 16px; line-height: 1; font-family: IPAmjMincho;\">" + l_texts + "</g>" + "<g style=\"fill: none; stroke: #000000; stroke-width: 2;\">" + l_paths + "</g>" + "</svg>";
}

