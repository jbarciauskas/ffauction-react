import React, {Component} from "react";
import {AgGridReact} from "ag-grid-react";
import {Button, Grid, Row, Col} from "react-bootstrap";


export default class extends Component {
    constructor(props) {
        super(props);

        this.onPlayerPriceEntry = this.onPlayerPriceEntry.bind(this);
        this.state = {
            quickFilterText: null,
            columnDefs: this.createColumnDefs()
        }
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
        this.gridApi.sizeColumnsToFit();
    }

    onQuickFilterText(event) {
        this.setState({quickFilterText: event.target.value});
    }

    onPlayerPriceEntry(event) {
      if(event.column.colId == "purchase_price") {
        event.data.purchase_price = parseFloat(event.data.purchase_price);
        localStorage.setItem(event.data.player_id + ".purchase_price", event.data.purchase_price);
        this.props.onPlayerPurchase(event);
      }
    }

    clearSavedPrices(event) {
      this.props.rowData.forEach((player) => {
        player.purchase_price = null;
        localStorage.removeItem(player.player_id + ".purchase_price");
      });
      this.setState({rowData: this.props.rowData});
    }

    createColumnDefs() {
        return [
            {headerName: "Player name", field: "name", filter: "text"},
            {headerName: "Pos", field: "position", filter: "text"},
            {headerName: "Team", field: "team", filter: "text"},
            {headerName: "Projected Points", field: "points", filter: "number", cellRenderer: formatNumber, sortingOrder: ['desc','asc']},
            {headerName: "Base Value ($)", field: "base_price", filter: "number", cellRenderer: formatNumber, sortingOrder: ['desc','asc']},
            {headerName: "Inf Value ($)", field: "inflated_price", filter: "number", cellRenderer: formatNumber, sortingOrder: ['desc','asc']},
            {headerName: "Actual ($)", field: "purchase_price", filter: "number", cellRenderer: formatNumber, sortingOrder: ['desc','asc'], editable: true, cellEditor: "text", onCellValueChanged:this.onPlayerPriceEntry}
        ];
    }

    render() {
        let containerStyle = {
            height: "500px",
        };

        return (
            <div style={containerStyle} className="ag-fresh">
            <h1>Players</h1>
                <input type="text" onChange={this.onQuickFilterText.bind(this)}
                                           placeholder="Type text to filter..."/>
                <Button id="btDestroyGrid" onClick={this.clearSavedPrices}>Clear purchase prices</Button>
                <AgGridReact
                    // properties
                    columnDefs={this.state.columnDefs}
                    rowData={this.props.rowData}
                    quickFilterText={this.state.quickFilterText}

                    enableSorting
                    enableFilter

                    // events
                    onGridReady={this.onGridReady}
                    >
                </AgGridReact>
            </div>
        )
    }
}

function formatNumber(params) {
    let num = parseFloat(Math.round(params.value * 100) / 100).toFixed(2);
    if(isNaN(num)) {
      return "-";
    }
    else return num;
}
