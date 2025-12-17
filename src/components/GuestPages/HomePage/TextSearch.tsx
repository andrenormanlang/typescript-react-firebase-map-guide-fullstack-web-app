import React from 'react';
import Form from 'react-bootstrap/Form';

type Props = {
    onSearch: (searchTerm: string) => void;
};

const TextSearch: React.FC<Props> = ({ onSearch }) => {
    return (
        <Form.Group className="mb-3">
            <Form.Control
                type="text"
                placeholder="Search by name..."
                onChange={(e) => onSearch(e.target.value)}
            />
        </Form.Group>
    );
};

export default TextSearch;
