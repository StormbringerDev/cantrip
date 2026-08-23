import type {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  BreakStmt,
  CallExpr,
  ContinueStmt,
  Expr,
  ExprStmt,
  ExprVisitor,
  FunctionStmt,
  GetExpr,
  GroupingExpr,
  IfExpr,
  IndexExpr,
  IndexSetExpr,
  LetStmt,
  LiteralExpr,
  LoopExpr,
  MatchExpr,
  ReturnStmt,
  SetExpr,
  Stmt,
  StmtVisitor,
  Token,
  UnaryExpr,
  VarExpr,
  WhileStmt,
} from "@cantrip/ast";
import { diagnosticFromToken, type DiagnosticCollector } from "@cantrip/diagnostics";
import type { Interpreter } from "@cantrip/interpreter";

enum FunctionType {
  None,
  Function,
}

enum LoopType {
  None,
  Inf,
  While,
}

/**
 * A variable resolver for Cantrip's static analysis.
 */
export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter;
  private readonly diagnostics: DiagnosticCollector;
  private readonly sourceId: string;
  private readonly scopes: Map<string, boolean>[] = [];
  private currentFunction: FunctionType = FunctionType.None;
  private currentLoop: LoopType = LoopType.None;

  /**
   * @param interpreter - The current interpreter.
   * @param diagnostics - The diagnostic collector.
   * @param sourceId - The name of the source file.
   */
  constructor(
    interpreter: Interpreter,
    diagnostics: DiagnosticCollector,
    sourceId: string,
  ) {
    this.interpreter = interpreter;
    this.diagnostics = diagnostics;
    this.sourceId = sourceId;
  }

  /**
   * Resolves variable values from a list of statements.
   *
   * @param statements - The statements to resolve the variables of.
   */
  public resolve(statements: Stmt[]): void {
    for (const statement of statements) {
      this.resolveStatement(statement);
    }
  }

  private resolveStatement(stmt: Stmt): void {
    stmt.accept(this);
  }

  private resolveExpression(expr: Expr): void {
    expr.accept(this);
  }

  private resolveFunction(func: FunctionStmt, type: FunctionType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();
    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolveExpression(func.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope(): void {
    this.scopes.push(new Map());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1)!;
    if (scope.has(name.lexeme)) {
      this.diagnostics.emit(
        diagnosticFromToken("Already a variable with this name in this scope.", name, {
          sourceId: this.sourceId,
        }),
      );
    }

    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (this.scopes.length === 0) return;
    this.scopes.at(-1)?.set(name.lexeme, true);
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes.at(i)?.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  public visitAssignExpr(expr: AssignExpr): void {
    this.resolveExpression(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  public visitBinaryExpr(expr: BinaryExpr): void {
    this.resolveExpression(expr.left);
    this.resolveExpression(expr.right);
  }

  public visitBlockExpr(expr: BlockExpr): void {
    this.beginScope();
    this.resolve(expr.statements);
    if (expr.value !== null) this.resolveExpression(expr.value);
    this.endScope();
  }

  public visitCallExpr(expr: CallExpr): void {
    this.resolveExpression(expr.callee);

    for (const argument of expr.args) {
      this.resolveExpression(argument);
    }
  }

  public visitGetExpr(expr: GetExpr): void {
    this.resolveExpression(expr.object);
  }

  public visitGroupingExpr(expr: GroupingExpr): void {
    this.resolveExpression(expr.expression);
  }

  public visitIfExpr(expr: IfExpr): void {
    this.resolveExpression(expr.condition);
    this.resolveExpression(expr.thenBranch);
    if (expr.elseBranch !== null) this.resolveExpression(expr.elseBranch);
  }

  public visitIndexExpr(expr: IndexExpr): void {
    this.resolveExpression(expr.indexee);
    this.resolveExpression(expr.index);
  }

  public visitIndexSetExpr(expr: IndexSetExpr): void {
    this.resolveExpression(expr.value);
    this.resolveExpression(expr.indexee);
    this.resolveExpression(expr.index);
  }

  public visitLiteralExpr(_expr: LiteralExpr): void {
    return;
  }

  public visitLoopExpr(expr: LoopExpr): void {
    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.Inf;
    this.resolveExpression(expr.body);
    this.currentLoop = enclosingLoop;
  }

  public visitMatchExpr(expr: MatchExpr): void {
    this.resolveExpression(expr.matcher);
    for (const [key, value] of expr.branches) {
      this.resolveExpression(key);
      this.resolveExpression(value);
    }
  }

  public visitSetExpr(expr: SetExpr): void {
    this.resolveExpression(expr.value);
    this.resolveExpression(expr.object);
  }

  public visitUnaryExpr(expr: UnaryExpr): void {
    this.resolveExpression(expr.right);
  }

  public visitVarExpr(expr: VarExpr): void {
    if (this.scopes.length !== 0 && this.scopes.at(-1)?.get(expr.name.lexeme) === false) {
      this.diagnostics.emit(
        diagnosticFromToken(
          "Can't read local variable in its own initializer.",
          expr.name,
          { sourceId: this.sourceId },
        ),
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  public visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  public visitBreakStmt(stmt: BreakStmt): void {
    if (this.currentLoop === LoopType.None) {
      this.diagnostics.emit(
        diagnosticFromToken("Can't break from outside of a loop.", stmt.keyword, {
          sourceId: this.sourceId,
        }),
      );
    }

    if (stmt.value !== null) {
      if (this.currentLoop === LoopType.While) {
        diagnosticFromToken("Can't return a value from a while loop.", stmt.keyword, {
          sourceId: this.sourceId,
        });
      }

      this.resolveExpression(stmt.value);
    }
  }

  public visitContinueStmt(stmt: ContinueStmt): void {
    if (this.currentLoop === LoopType.None) {
      this.diagnostics.emit(
        diagnosticFromToken("Can't continue from outside of a loop.", stmt.keyword, {
          sourceId: this.sourceId,
        }),
      );
    }
  }

  public visitExprStmt(stmt: ExprStmt): void {
    this.resolveExpression(stmt.expr);
  }

  public visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunction(stmt, FunctionType.Function);
  }

  public visitLetStmt(stmt: LetStmt): void {
    this.declare(stmt.name);
    if (stmt.initializer !== null) {
      this.resolveExpression(stmt.initializer);
    }
    this.define(stmt.name);
  }

  public visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction === FunctionType.None) {
      this.diagnostics.emit(
        diagnosticFromToken("Can't return from top-level code.", stmt.keyword, {
          sourceId: this.sourceId,
        }),
      );
    }

    if (stmt.value !== null) {
      this.resolveExpression(stmt.value);
    }
  }

  public visitWhileStmt(stmt: WhileStmt): void {
    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.While;
    this.resolveExpression(stmt.condition);
    this.resolveStatement(stmt.body);
    this.currentLoop = enclosingLoop;
  }
}
