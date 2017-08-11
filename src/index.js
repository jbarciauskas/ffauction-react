'use strict';

import React from "react";
import ReactDOM from 'react-dom';
import axios from 'axios';
import {Button,Modal,OverlayTrigger,Popover,Tooltip} from 'react-bootstrap';


// pull in the ag-grid styles we're interested in
import "ag-grid-root/dist/styles/ag-grid.css";
import "ag-grid-root/dist/styles/theme-fresh.css";

// our application
import PlayerGrid from "./PlayerGrid";

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      startingBudget: 1980,
      remainingBudget: 1980,
      rowData: [],
      showModal: false
    }

    this.onPlayerPriceChange = this.onPlayerPriceChange.bind(this);
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);

    axios.get(`http://localhost:4000/players`)
    .then(res => {
      let inflationData = calcInflation(mergeSavedPrices(res.data), this.state.startingBudget);
      this.setState({
        rowData: inflationData['players'],
        remainingBudget: this.state.startingBudget - inflationData['usedBudget'],
      });
    });
  }

  onPlayerPriceChange() {
    console.log("Recalculating inflation");
    let inflationData = calcInflation(this.state.rowData, this.state.startingBudget);
    this.setState({
      rowData: inflationData['players'],
      remainingBudget: this.state.startingBudget - inflationData['usedBudget'],
    });
  }

  getInitialState() {
    return { showModal: false };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  render() {
    const popover = (
      <Popover id="modal-popover" title="popover">
        very popover. such engagement
      </Popover>
    );
    const tooltip = (
      <Tooltip id="modal-tooltip">
        wow.
      </Tooltip>
    );
    console.log(this.state);
    return (
      <div>
        <div>Remaining budget: <b>{this.state.remainingBudget}</b></div>
        <Button
          bsStyle="primary"
          bsSize="large"
          onClick={this.open}
        >
          Launch demo modal
        </Button>

        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Text in a modal</h4>
            <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>

            <h4>Popover in a modal</h4>
            <p>there is a <OverlayTrigger overlay={popover}><a href="#">popover</a></OverlayTrigger> here</p>

            <h4>Tooltips in a modal</h4>
            <p>there is a <OverlayTrigger overlay={tooltip}><a href="#">tooltip</a></OverlayTrigger> here</p>

            <hr />

            <h4>Overflowing text to show scroll behavior</h4>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
        <PlayerGrid
          rowData={this.state.rowData}
          onPlayerPriceChange={this.onPlayerPriceChange}>
        </PlayerGrid>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));

function calcInflation(players, startingBudget) {
  let accumulatedValue = 0;
  let usedBudget = 0;
  players.forEach((player) => {
    if(player.hasOwnProperty('purchase_price') && !isNaN(player.purchase_price) && player.purchase_price !== null) {
      accumulatedValue += player.base_price - player.purchase_price;
      usedBudget = player.purchase_price;
    }
  });
  let inflationRate = (startingBudget + accumulatedValue) / startingBudget
  players.forEach((player) => {
    player.inflated_price = inflationRate * player.base_price;
  });
  return {"players": players, "usedBudget": usedBudget};
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
