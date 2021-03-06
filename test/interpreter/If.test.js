const BrsError = require("../../lib/Error");
const Expr = require("../../lib/parser/Expression");
const Stmt = require("../../lib/parser/Statement");
const { identifier, token } = require("../parser/ParserTests");
const { binary } = require("./InterpreterTests");
const { Lexeme } = require("../../lib/Lexeme");
const { Interpreter } = require("../../lib/interpreter");
const { Int32, BrsString, BrsBoolean, BrsInvalid } = require("../../lib/brsTypes");

let interpreter;

const END_INVALID = {
    value: BrsInvalid.Instance,
    reason: Stmt.StopReason.End
};

describe("interpreter if statements", () => {
    let assignTo;

    beforeEach(() => {
        BrsError.reset();

        assignTo = {
            foo: new Stmt.Assignment(
                identifier("foo"),
                new Expr.Literal(BrsBoolean.True)
            ),
            bar: new Stmt.Assignment(
                identifier("bar"),
                new Expr.Literal(BrsBoolean.False)
            ),
            lorem: new Stmt.Assignment(
                identifier("lorem"),
                new Expr.Literal(new BrsString("lorem"))
            ),
            ipsum: new Stmt.Assignment(
                identifier("ipsum"),
                new Expr.Literal(new BrsString("ipsum"))
            ),
            dolor: new Stmt.Assignment(
                identifier("dolor"),
                new Expr.Literal(new BrsString("dolor"))
            ),
            sit: new Stmt.Assignment(
                identifier("sit"),
                new Expr.Literal(new BrsString("sit"))
            ),
            amet: new Stmt.Assignment(
                identifier("amet"),
                new Expr.Literal(new BrsString("amet"))
            )
        }

        interpreter = new Interpreter();
    });

    it("executes 'then' statements if 'condition' is 'true'", () => {
        assignTo.bar.accept = jest.fn().mockReturnValue(END_INVALID);
        let statements = [
            new Stmt.If(
                new Expr.Binary(
                    new Expr.Literal(new Int32(1)),
                    token(Lexeme.Less),
                    new Expr.Literal(new Int32(2))
                ),
                new Stmt.Block([
                    assignTo.foo,
                    assignTo.bar
                ])
            )
        ];

        let results = interpreter.exec(statements);
        expect(assignTo.bar.accept).toBeCalled();
    });

    it("skips 'then' statements if 'condition' is 'false'", () => {
        assignTo.foo.accept = jest.fn().mockReturnValue(END_INVALID);
        let statements = [
            new Stmt.If(
                new Expr.Binary(
                    new Expr.Literal(new Int32(2)),
                    token(Lexeme.Less),
                    new Expr.Literal(new Int32(1))
                ),
                new Stmt.Block([
                    assignTo.foo,
                    assignTo.bar
                ])
            )
        ];

        let results = interpreter.exec(statements);
        expect(assignTo.foo.accept).not.toBeCalled();
    });

    it("only executes one valid 'else if' that evaluates to 'true'", () => {
        let shouldExecute = jest.fn().mockReturnValue(END_INVALID);
        let shouldNotExecute = jest.fn().mockReturnValue(END_INVALID);

        [assignTo.foo, assignTo.bar, assignTo.dolor, assignTo.sit, assignTo.amet].forEach(
            assignment => assignment.accept = shouldNotExecute
        );
        [assignTo.lorem, assignTo.ipsum].forEach(
            assignment => assignment.accept = shouldExecute
        );

        let statements = [
            new Stmt.If(
                new Expr.Binary(
                    new Expr.Literal(new Int32(2)),
                    token(Lexeme.Less),
                    new Expr.Literal(new Int32(1))
                ),
                new Stmt.Block([
                    assignTo.foo,
                    assignTo.bar
                ]),
                [
                    {
                        condition: new Expr.Literal(BrsBoolean.True),
                        thenBranch: new Stmt.Block([assignTo.lorem, assignTo.ipsum])
                    },
                    {
                        condition: new Expr.Literal(BrsBoolean.True),
                        thenBranch: new Stmt.Block([assignTo.dolor, assignTo.sit])
                    }
                ],
                new Stmt.Block([
                    assignTo.amet
                ])
            )
        ];

        let results = interpreter.exec(statements);
        expect(shouldNotExecute).not.toBeCalled();
        expect(shouldExecute).toHaveBeenCalledTimes(2);
    })

    it("executes 'else' statements if nothing else matches", () => {
        let shouldExecute = jest.fn().mockReturnValue(END_INVALID);
        let shouldNotExecute = jest.fn().mockReturnValue(END_INVALID);

        [assignTo.foo, assignTo.bar, assignTo.lorem, assignTo.ipsum, assignTo.dolor, assignTo.sit].forEach(
            assignment => assignment.accept = shouldNotExecute
        );
        assignTo.amet.accept = shouldExecute;

        let statements = [
            new Stmt.If(
                new Expr.Binary(
                    new Expr.Literal(new Int32(2)),
                    token(Lexeme.Less),
                    new Expr.Literal(new Int32(1))
                ),
                new Stmt.Block([
                    assignTo.foo,
                    assignTo.bar
                ]),
                [
                    {
                        condition: new Expr.Literal(BrsBoolean.False),
                        thenBranch: new Stmt.Block([assignTo.lorem, assignTo.ipsum])
                    },
                    {
                        condition: new Expr.Literal(BrsBoolean.False),
                        thenBranch: new Stmt.Block([assignTo.dolor, assignTo.sit])
                    }
                ],
                new Stmt.Block([
                    assignTo.amet
                ])
            )
        ];

        let results = interpreter.exec(statements);
        expect(shouldNotExecute).not.toBeCalled();
        expect(shouldExecute).toBeCalled();
    });
});