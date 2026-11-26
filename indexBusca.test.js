const assert = require("node:assert/strict");
const dados = require("./cardapios_restaurantes.json");
const { selecionarResultados } = require("./indexBusca.js");

const resultadosLeVerre = selecionarResultados(dados.restaurantes, "Le Verre");
const nomesLeVerre = new Set(resultadosLeVerre.map(item => item.comida));

assert.equal(resultadosLeVerre.length, 20);
assert.equal(nomesLeVerre.size, 20);

const resultadosCoq = selecionarResultados(dados.restaurantes, "Coq au Vin");
const restaurantesCoq = new Set(resultadosCoq.map(item => item.restaurante));

assert.equal(resultadosCoq.length, restaurantesCoq.size);

console.log("Busca: regras de restaurante e prato aprovadas.");
