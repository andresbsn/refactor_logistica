const createSqlFilterBuilder = ({ baseConditions = [] } = {}) => {
    const clauses = [...baseConditions];
    const params = [];
    let paramIndex = 1;

    const add = (sql, values = []) => {
        const normalizedValues = Array.isArray(values) ? values : [values];
        let valueIndex = 0;

        const clause = sql.replace(/\?/g, () => {
            if (valueIndex >= normalizedValues.length) {
                throw new Error('Not enough values supplied for SQL filter clause');
            }

            params.push(normalizedValues[valueIndex]);
            valueIndex += 1;
            return `$${paramIndex++}`;
        });

        if (valueIndex !== normalizedValues.length) {
            throw new Error('Too many values supplied for SQL filter clause');
        }

        clauses.push(clause);
    };

    const addRaw = (sql) => {
        clauses.push(sql);
    };

    const build = (joiner = ' AND ') => clauses.join(joiner);

    return {
        add,
        addRaw,
        build,
        params,
    };
};

module.exports = {
    createSqlFilterBuilder,
};
