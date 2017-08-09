import React, {Component} from "react";
import {AgGridReact} from "ag-grid-react";
import axios from 'axios';


export default class extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnDefs: this.createColumnDefs(),
            rowData: []
        }
        axios.get(`http://localhost:4000/players`)
        .then(res => {
          console.log(res)
          this.setState({
            columnDefs: this.state.columnDefs,
            rowData: res.data
          });
        });
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;

        this.gridApi.sizeColumnsToFit();
    }

    createColumnDefs() {
        return [
            {headerName: "Player name", field: "name"},
            {headerName: "Pos", field: "position"},
            {headerName: "Team", field: "team"},
            {headerName: "Projected Points", field: "points"},
            {headerName: "Base Value ($)", field: "base_price"},
        ];
    }

    render() {
        let containerStyle = {
            height: 115,
            width: 500
        };

        return (
            <div style={containerStyle} className="ag-fresh">
                <h1>Players</h1>
                <AgGridReact
                    // properties
                    columnDefs={this.state.columnDefs}
                    rowData={this.state.rowData}

                    // events
                    onGridReady={this.onGridReady}>
                </AgGridReact>
            </div>
        )
    }
};
