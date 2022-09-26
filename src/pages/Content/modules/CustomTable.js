import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import Pagination from 'rc-pagination';
import 'rc-pagination/assets/index.css';

import './CustomTable.css';

const CustomTable = (props) => {
  const { columns, data, countPerPage } = props;

  const [value, setValue] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [collection, setCollection] = React.useState(
    cloneDeep(data.slice(0, countPerPage))
  );
  const searchData = React.useRef(
    throttle((val) => {
      const query = val.toLowerCase();
      setCurrentPage(1);
      const filtered = cloneDeep(
        data
          .filter((item) => item.id.toLowerCase().indexOf(query) > -1)
          .slice(0, countPerPage)
      );
      setCollection(filtered);
    }, 400)
  );

  React.useEffect(() => {
    if (!value) {
      updatePage(1);
    } else {
      searchData.current(value);
    }
  }, [value]);

  const updatePage = (p) => {
    setCurrentPage(p);
    const to = countPerPage * p;
    const from = to - countPerPage;
    setCollection(cloneDeep(data.slice(from, to)));
  };

  const tableRows = (rowData) => {
    const { key, index } = rowData;
    const tableCell = columns.map((e) => e.dataIndex);

    const columnData = tableCell.map((keyD, i) => {
      const value = columns[i].render?.(key[keyD], index)
        ? columns[i].render?.(key[keyD], i)
        : key[keyD];

      return <td key={i}>{value}</td>;
    });

    return (
      <tr data-id={key['id']} key={index}>
        {columnData}
      </tr>
    );
  };

  const tableData = () => {
    return collection.map((key, index) => {
      return tableRows({ key, index });
    });
  };

  const headRow = () => {
    return Object.values(columns).map((_data, index) => {
      const { title, dataIndex } = _data;

      return <td key={dataIndex}>{title}</td>;
    });
  };

  return (
    <div className="CustomTable">
      <div className="search">
        <input
          placeholder="Search ID"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <table>
        <thead>
          <tr>{headRow()}</tr>
        </thead>
        <tbody className="trhover">{tableData()}</tbody>
      </table>
      <Pagination
        pageSize={countPerPage}
        onChange={updatePage}
        current={currentPage}
        total={data.length}
      />
    </div>
  );
};
export default CustomTable;
