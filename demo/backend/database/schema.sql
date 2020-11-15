create table if not exists Customer (
    id int(11) not null auto_increment,
    name varchar(36) not null,
    email varchar(36) not null,
    primary key (id)
) default charset=utf8;
