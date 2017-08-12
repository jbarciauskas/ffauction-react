import React, {Component} from "react";
import {AgGridReact} from "ag-grid-react";
import {Button, Grid, Row, Col, FormControl} from "react-bootstrap";


export default class extends Component {
    constructor(props) {
        super(props);

        this.onPlayerPriceChange = this.onPlayerPriceChange.bind(this);
        this.clearSavedPrices = this.clearSavedPrices.bind(this);
        this.onGridReady = this.onGridReady.bind(this);
        this.getRowStyle = this.getRowStyle.bind(this);
        this.state = {
            quickFilterText: null,
            columnDefs: this.createColumnDefs()
        };
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
        this.gridApi.sizeColumnsToFit();
    }

    onQuickFilterText(event) {
        this.setState({quickFilterText: event.target.value});
    }

    onPlayerPriceChange(event) {
      if(event.column.colId == "purchase_price") {
        let player = event.data;
        event.data.purchase_price = parseFloat(event.data.purchase_price);
        localStorage.setItem(event.data.player_id + ".purchase_price", event.data.purchase_price);
        console.log(player);
        // bubble up
        this.props.onPlayerPriceChange(event);
      }
    }

    clearSavedPrices(event) {
      this.props.rowData.forEach((player) => {
        player.purchase_price = null;
        localStorage.removeItem(player.player_id + ".purchase_price");
      });
      this.props.onPlayerPriceChange();
      this.gridApi.setRowData(this.props.rowData);
    }

    createColumnDefs() {
        return [
            {headerName: "Player name", field: "name", filter: "text"},
            {headerName: "Pos", field: "position", filter: "text"},
            {headerName: "Team", field: "team", filter: "text"},
            {headerName: "Projected Points", field: "points", filter: "number", cellRenderer: formatNumber, sortingOrder: ['desc','asc']},
            {headerName: "Base Value ($)", field: "base_price", filter: "number", cellRenderer: formatNumber, sortingOrder: ['desc','asc']},
            {headerName: "Inf Value ($)", field: "inflated_price", filter: "number", cellRenderer: formatNumber, sort: 'desc', sortingOrder: ['desc','asc']},
            {headerName: "Purchase ($)", field: "purchase_price", filter: "number", cellRenderer: formatInt, sortingOrder: ['desc','asc'], editable: true, cellEditor: "text", onCellValueChanged:this.onPlayerPriceChange},
            {headerName: "Drafted by", field: "draft_team", filter: "text", cellEditor: 'select', cellEditorParams: {'values':this.props.teamList}, editable: true},
        ];
    }

    getRowStyle(params) {
      var player = params.data;
      if(player.hasOwnProperty('purchase_price') && !isNaN(player.purchase_price) && player.purchase_price !== null) {
        return {
          color: 'gray',
          "font-style": 'italic',
        };
      }
    }

    render() {
        let containerStyle = {
            height: "500px",
        };

        return (
            <div >
              <Row>
                <Col md={3}>
                  <FormControl type="text" onChange={this.onQuickFilterText.bind(this)}
                                           placeholder="Type text to filter..."/>
                </Col>
                <Col md={1}>
                <Button id="btDestroyGrid" onClick={this.clearSavedPrices}>Clear purchase prices</Button>
                </Col>
              </Row>
              <Row>
              <Col md={12} >

              <div style={containerStyle} className="ag-fresh">
                <AgGridReact
                    // properties
                    columnDefs={this.state.columnDefs}
                    rowData={this.props.rowData}
                    quickFilterText={this.state.quickFilterText}

                    enableSorting
                    enableFilter
                    singleClickEdit
                    getRowStyle={this.getRowStyle}

                    // events
                    onGridReady={this.onGridReady}
                    >
                </AgGridReact>
                </div>
                </Col>
                </Row>
                </div>
        )
    }
}

function formatNumber(params) {
    let num = parseFloat(Math.round(params.value * 100) / 100).toFixed(2);
    if(isNaN(num) || num === null) {
      return "-";
    }
    else return num;
}
function formatInt(params) {
    let num = parseInt(params.value);
    if(isNaN(num) || num === null) {
      return "-";
    }
    else return num;
}
