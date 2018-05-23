import React, { Component } from 'react';
import 'whatwg-fetch';
import './App.css';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { observer } from "mobx-react"
import { observable } from "mobx"
import {
  serialize,
  deserialize,
  serializable,
  primitive,
  object,
  createSimpleSchema
} from 'serializr';

const capitalizeFirstLetter = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

const ValuePicker = ({ selectedOptions, options, handleValueChange, type }) =>
  <div className={`select-row select-row-${type}`}>
    <label>
      {capitalizeFirstLetter(type)}
    </label>
    <div className="select-wrapper">
      <Select
        backspaceRemoves={false}
        deleteRemoves={false}
        name={`${type}-select`}
        value={(selectedOptions && selectedOptions[type]) || options[0]}
        onChange={handleValueChange(type)}
        options={options}
      />
    </div>
  </div>

const optionSchema = createSimpleSchema({
  value: primitive(),
  label: primitive()
});

const selectedOptionsSchema = createSimpleSchema({
  country: object(optionSchema),
  currency: object(optionSchema)
});

@observer class App extends Component {

  @observable @serializable selectedOptions = {
    country: null,
    currency: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      countries: [],
      currencies: []
    };

    const storedOptions = localStorage.getItem('selectedOptions');
    if (storedOptions) {
      this.selectedOptions = deserialize(selectedOptionsSchema, JSON.parse(storedOptions))
    }

  }

  async componentDidMount() {
    try {
      const [countries, currencies] = (await Promise.all([
        await (await fetch('https://api.pleasepay.co.uk/countries')).json()
        , await (await fetch('https://api.pleasepay.co.uk/currencies')).json()]))
        .map(e => e.items);
      this.setState({
        countries,
        currencies
      });
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    const [countryOptions, currencyOptions] = [this.state.countries, this.state.currencies].map(a =>
      a.map(e => ({
        value: e._id,
        label: e.translations.en
      })));

    const handleValueChange = (type) => (selectedOption) => {

      let newOptions = {
        ...this.selectedOptions,
        [type]: selectedOption
      }

      if (type === 'country') {
        try {
          const currencyId = this.state.countries
            .filter(e => e._id === selectedOption.value)[0]
            .preferredCurrency.id;

          newOptions.currency = currencyOptions.filter(e => e.value === currencyId)[0]

        } catch (e) {
          console.log(e);
        }
      }
 
      localStorage.setItem('selectedOptions',
        JSON.stringify(serialize(selectedOptionsSchema, newOptions)));

      this.selectedOptions = newOptions;

      console.log(`Selected ${type}: ${selectedOption.label}`);
    }

    return (
      <div className="App">
        <div className="main-wrapper no-select">
          <ValuePicker
            type="country"
            handleValueChange={handleValueChange}
            selectedOptions={this.selectedOptions}
            options={countryOptions}>
          </ValuePicker>
          <ValuePicker
            type="currency"
            handleValueChange={handleValueChange}
            selectedOptions={this.selectedOptions}
            options={currencyOptions}>
          </ValuePicker>
        </div>
      </div>
    );
  }
}

export default App;
