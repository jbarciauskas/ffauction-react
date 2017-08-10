'use strict';

import React from "react";
import ReactDOM from 'react-dom';
import axios from 'axios';
import Modal from 'react-modal';


// pull in the ag-grid styles we're interested in
import "ag-grid-root/dist/styles/ag-grid.css";
import "ag-grid-root/dist/styles/theme-fresh.css";

// our application
import PlayerGrid from "./PlayerGrid";

const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      modalIsOpen: false,
      startingBudget: 1980,
      rowData: []
    }

    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.onPlayerPurchase = this.onPlayerPurchase.bind(this);

    axios.get(`http://localhost:4000/players`)
    .then(res => {
      this.setState({
        rowData: calcInflation(mergeSavedPrices(res.data), this.state.startingBudget),
      });
    });
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    this.subtitle.style.color = '#f00';
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  onPlayerPurchase() {
    this.setState({
      rowData: calcInflation(this.state.rowData, this.state.startingBudget)
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.openModal}>Open Modal</button>
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >

          <h2 ref={subtitle => this.subtitle = subtitle}>Hello</h2>
          <button onClick={this.closeModal}>close</button>
          <div>I am a modal</div>
          <form>
            <input />
            <button>tab navigation</button>
            <button>stays</button>
            <button>inside</button>
            <button>the modal</button>
          </form>
        </Modal>
        <PlayerGrid
          rowData={this.state.rowData}
          onPlayerPurchase={this.onPlayerPurchase}>
        </PlayerGrid>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));

function calcInflation(players, startingBudget) {
  let accumulatedValue = 0;
  players.forEach((player) => {
    if(player.hasOwnProperty('purchase_price') && !isNaN(player.purchase_price)) {
      accumulatedValue += player.base_price - player.purchase_price;
    }
  });
  let inflationRate = (startingBudget + accumulatedValue) / startingBudget
  players.forEach((player) => {
    player.inflated_price = inflationRate * player.base_price;
  });
  return players;
}

function mergeSavedPrices(players) {
  players.forEach((player) => {
    let purchasePrice = localStorage.getItem(player.player_id + ".purchase_price");
    if(purchasePrice) {
      player.purchase_price = purchasePrice;
    }
    purchasePrice = null;
  });
  return players;
}
