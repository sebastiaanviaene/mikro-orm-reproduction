import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/sqlite";

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToMany(() => Book, (book) => book.user)
  public books = new Collection<Book>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne()
  user?: User;

  constructor(name: string) {
    this.name = name;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [User, Book],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("basic CRUD example - no populate - user debuggable in VSCode", async () => {
  const books = [new Book("Book 1"), new Book("Book 2")];
  orm.em.create(User, { name: "Foo", email: "foo", books: books });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: "foo" });
  expect(user.name).toBe("Foo");
});

// if you hover over user in the next test, you will see that it is not debuggable and node process will spike to 100% CPU
// this happens only on findOne, not on find
// also does not happen in WebStorm or Chrome Debug, only in VSCode
test("basic CRUD example - populate books - user should not be debuggable in VSCode", async () => {
  const books = [new Book("Book 1"), new Book("Book 2")];
  orm.em.create(User, { name: "Bar", email: "bar", books: books });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(
    User,
    { email: "bar" },
    { populate: ["books"] }
  );
  expect(user.name).toBe("Bar");
});
